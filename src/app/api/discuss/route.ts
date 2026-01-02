import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession, discussionMessage } from "@/db/schema/planner";
import { apiConfig } from "@/lib/api-config";
import {
  getRound1Prompt,
  getRound2Prompt,
  getRound3Prompt,
  getSystemPrompt,
  PARTICIPANTS,
} from "@/lib/prompts";
import { eq } from "drizzle-orm";
import { extractTitle } from "@/lib/title-extractor";
import { extractDestinations } from "@/lib/entity-extraction";
import { recommendTripDuration } from "@/lib/duration-recommender";

/**
 * Multi-Model Discussion API
 *
 * This endpoint orchestrates a 3-round discussion between multiple AI models
 * to generate a comprehensive trip plan with flexible duration.
 */

interface DiscussRequest {
  question: string;
  pace: "fast" | "balanced" | "relaxed";
  budget: "budget-conscious" | "flexible";
  focus: "experience-first" | "practical";
}

// Mock data for development
const MOCK_DISCUSSION = {
  round1: {
    planner: `Based on the balanced pace and flexible budget, I'd recommend starting Day 1 with Times Square and Rockefeller Center, then MoMA and Central Park in the afternoon. For Day 2, focus on Statue of Liberty in the morning and Financial District in the afternoon. This keeps travel time minimal and hits the iconic spots.`,

    realityChecker: `I'd suggest starting Day 1 at Central Park (less crowded in the morning), then the Met Museum and Fifth Avenue. Day 2 should begin with an early Statue of Liberty ferry to beat crowds, then 9/11 Memorial. Need to book Broadway shows weeks in advance and expect 30+ minutes for security.`,

    budgetAdvisor: `From a budget-conscious perspective, I recommend the Staten Island Ferry for free Statue of Liberty views instead of paying for the tour. Day 1: Free 9/11 Memorial and Chinatown lunch. Day 2: Central Park (free) and Brooklyn Bridge walk. Many museums have pay-what-you-wish hours.`,
  },

  round2: {
    planner: `Reality Checker, I like your crowd timing strategy, but Top of the Rock and Empire State in one day feels redundant. Budget Advisor, I'm concerned that skipping paid attractions misses the point of a special trip - the Staten Island Ferry is practical but not a destination experience.`,

    realityChecker: `Planner, Times Square at 9 AM still has significant crowds. Also, mentioning a Broadway show without booking timeline is unrealistic - they sell out weeks ahead. Budget Advisor, the Staten Island Ferry is smart, but Chinatown to Brooklyn Bridge is a lot of walking, and MoMA's free hours are limited.`,

    budgetAdvisor: `Planner, your proposal adds up quickly: Top of the Rock ($40+), MoMA ($30), plus Broadway ($100+) - that's $200+ without mentioning these costs. Reality Checker, good timing advice, but the Met Museum's "pay what you wish" is only for NY residents, not tourists.`,
  },

  round3: {
    agreements: [
      "2-day NYC trip should focus on iconic first-time experiences",
      "Geographic clustering is essential to minimize travel time",
      "Central Park and Financial District are must-see areas",
      "Timing matters for crowds (Statue of Liberty, 9/11 Memorial)",
      "Mix of outdoor sightseeing and cultural attractions",
    ],
    disagreements: [
      "Budget approach: Planner prioritizes experience quality, Budget Advisor prioritizes cost savings, Reality Checker focuses on practical logistics",
      "Times Square: Planner includes it, Reality Checker warns about crowds, Budget Advisor notes it's free but touristy",
      "Statue of Liberty: Planner suggests paid tour, Reality Checker emphasizes early timing, Budget Advisor prefers free Staten Island Ferry",
      "Museum costs: Planner and Reality Checker suggest paid museums, Budget Advisor pushes for free alternatives",
    ],
    recommendation: `## ✅ What most models agree on
• Geographic clustering to minimize travel time
• Central Park and Financial District as must-see areas
• Timing is crucial for crowds at Statue of Liberty and 9/11 Memorial
• Mix of outdoor sightseeing and cultural attractions

## ⚠️ Where models disagree
• Budget vs. experience - Resolved by offering free alternatives where possible but recommending key paid experiences
• Statue of Liberty approach - Resolved by suggesting early ferry to balance cost and experience

## 👉 Final recommendation

Day 1: Start with Central Park (9 AM) to avoid crowds, then Metropolitan Museum. Lunch on Upper East Side. Afternoon: Fifth Avenue walk and Top of the Rock for views. Evening: Koreatown dinner. Budget ~$120.

Day 2: Early Statue of Liberty ferry (8 AM) to beat crowds, then 9/11 Memorial. Lunch in Chelsea Market. Afternoon: Brooklyn Bridge walk and DUMBO. Budget ~$80.

Total budget: ~$200, balancing iconic experiences with practical logistics.`,
  },
};

/**
 * Call LLM API (supports both Zhipu AI and DeepSeek)
 */
async function callLLM(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  provider: "zhipu" | "deepseek",
  maxTokens: number = 400
): Promise<string> {
  console.log(`callLLM: provider=${provider}, model=${model}, maxTokens=${maxTokens}`);

  if (apiConfig.useMockApi) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("callLLM: Using mock response");
    return "Mock response for development";
  }

  try {
    // Select API configuration based on provider
    const config =
      provider === "zhipu"
        ? {
            baseUrl: apiConfig.zhipu.baseUrl,
            apiKey: apiConfig.zhipu.apiKey,
          }
        : {
            baseUrl: apiConfig.deepseek.baseUrl,
            apiKey: apiConfig.deepseek.apiKey,
          };

    console.log(`callLLM: Calling ${config.baseUrl}/chat/completions`);
    console.log(`callLLM: API Key exists: ${!!config.apiKey}`);
    console.log(`callLLM: System prompt length: ${systemPrompt.length}`);
    console.log(`callLLM: User prompt length: ${userPrompt.length}`);

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    console.log(`callLLM: Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`callLLM: Error response:`, errorText);
      throw new Error(`${provider.toUpperCase()} API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`callLLM: Success, response length: ${data.choices[0].message.content.length}`);
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error calling ${provider.toUpperCase()}:`, error);
    throw error;
  }
}

/**
 * Run the 3-round discussion with progress updates
 */
async function runDiscussion(
  params: DiscussRequest,
  sessionId: string,
  destinations: string[],
  duration: number
): Promise<{
  round1: Record<string, string>;
  round2: Record<string, string>;
  round3: {
    agreements: string[];
    disagreements: string[];
    recommendation: string;
  };
}> {
  console.log(`[runDiscussion] Starting discussion with duration: ${duration} days`);

  if (apiConfig.useMockApi) {
    // Return mock data for development, but still save to database
    console.log("[runDiscussion] Using Mock API mode");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Save mock messages to database
    const round1MessageIds: Record<string, string> = {};

    // Round 1 messages
    for (const [key, content] of Object.entries(MOCK_DISCUSSION.round1)) {
      const messageId = crypto.randomUUID();
      round1MessageIds[key] = messageId;
      await db.insert(discussionMessage).values({
        id: messageId,
        sessionId,
        agentId: key,
        round: 1,
        content,
      });
    }

    // Round 2 messages
    for (const [key, content] of Object.entries(MOCK_DISCUSSION.round2)) {
      const messageId = crypto.randomUUID();
      await db.insert(discussionMessage).values({
        id: messageId,
        sessionId,
        agentId: key,
        round: 2,
        content,
        replyToId: round1MessageIds[key], // Reply to own Round 1 proposal
      });
    }

    // Round 3 synthesis
    await db.insert(discussionMessage).values({
      id: crypto.randomUUID(),
      sessionId,
      agentId: "planner",
      round: 3,
      content: MOCK_DISCUSSION.round3.recommendation,
    });

    // Update session status to completed
    await db
      .update(plannerSession)
      .set({
        round1Proposals: MOCK_DISCUSSION.round1,
        round2Critiques: MOCK_DISCUSSION.round2,
        round3Consensus: MOCK_DISCUSSION.round3,
        agreements: JSON.stringify(MOCK_DISCUSSION.round3.agreements),
        disagreements: JSON.stringify(MOCK_DISCUSSION.round3.disagreements),
        recommendation: MOCK_DISCUSSION.round3.recommendation,
        status: "completed",
      })
      .where(eq(plannerSession.id, sessionId));

    console.log("[runDiscussion] Mock discussion completed, status updated to 'completed'");
    return MOCK_DISCUSSION;
  }

  // Round 1: Independent proposals
  console.log("Starting Round 1...");
  const round1: Record<string, string> = {};
  const round1MessageIds: Record<string, string> = {};
  for (const [key, participant] of Object.entries(PARTICIPANTS)) {
    console.log(`Round 1: ${key} proposing...`);
    const systemPrompt = getSystemPrompt(key as any, duration); // Pass duration
    const userPrompt = getRound1Prompt(
      key as any,
      params.question,
      params.pace,
      params.budget,
      params.focus,
      destinations  // Pass array of destinations instead of single destination
    );
    round1[key] = await callLLM(
      participant.model,
      systemPrompt,
      userPrompt,
      participant.provider,
      300  // Short, conversational responses
    );
    console.log(`Round 1: ${key} completed`);

    // Save individual message to discussion_messages table
    const messageId = crypto.randomUUID();
    round1MessageIds[key] = messageId;
    await db.insert(discussionMessage).values({
      id: messageId,
      sessionId,
      agentId: key,
      round: 1,
      content: round1[key],
    });

    // Update database with partial results (for backward compatibility)
    await db
      .update(plannerSession)
      .set({ round1Proposals: round1 })
      .where(eq(plannerSession.id, sessionId));
  }
  console.log("Round 1 completed");

  // Round 2: Critiques
  console.log("Starting Round 2...");
  const round2: Record<string, string> = {};
  for (const [key, participant] of Object.entries(PARTICIPANTS)) {
    console.log(`Round 2: ${key} critiquing...`);
    const systemPrompt = getSystemPrompt(key as any, duration); // Pass duration
    const userPrompt = getRound2Prompt(key as any, round1);
    round2[key] = await callLLM(
      participant.model,
      systemPrompt,
      userPrompt,
      participant.provider,
      400  // Short critiques
    );
    console.log(`Round 2: ${key} completed`);

    // Save individual message to discussion_messages table
    // Set replyToId to reference this agent's Round 1 proposal
    const messageId = crypto.randomUUID();
    await db.insert(discussionMessage).values({
      id: messageId,
      sessionId,
      agentId: key,
      round: 2,
      content: round2[key],
      replyToId: round1MessageIds[key], // Reply to own Round 1 proposal
    });

    // Update database with partial results (for backward compatibility)
    await db
      .update(plannerSession)
      .set({ round2Critiques: round2 })
      .where(eq(plannerSession.id, sessionId));
  }
  console.log("Round 2 completed");

  // Round 3: Synthesis
  console.log("Starting Round 3 (Synthesis)...");
  const systemPrompt = getSystemPrompt("planner", duration); // Pass duration
  const userPrompt = getRound3Prompt(round1, round2, duration); // Pass duration
  const round3Result = await callLLM(
    PARTICIPANTS.planner.model,
    systemPrompt,
    userPrompt,
    PARTICIPANTS.planner.provider,
    800  // Longer synthesis for final recommendation
  );
  console.log("Round 3 completed");

  // Save Round 3 synthesis message
  await db.insert(discussionMessage).values({
    id: crypto.randomUUID(),
    sessionId,
    agentId: "planner",
    round: 3,
    content: round3Result,
  });

  return {
    round1,
    round2,
    round3: {
      agreements: [],
      disagreements: [],
      recommendation: round3Result,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== /api/discuss called ===");
    const body: DiscussRequest = await req.json();
    console.log("Request body:", body);

    // Validate input
    if (!body.question || body.question.trim().length === 0) {
      console.log("Validation failed: Question is required");
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Extract destinations from question (filter out return trips like "回北京")
    const allDestinations = await extractDestinations(body.question);
    const destinations = allDestinations
      .filter(d => !d.isReturnTrip)
      .map(d => d.location);
    console.log("Extracted destinations (excluding return trips):", destinations);

    // Determine trip duration using intelligent recommendation
    console.log("Determining trip duration...");
    const duration = await recommendTripDuration({
      destinations: allDestinations.filter(d => !d.isReturnTrip),
      userQuestion: body.question,
      pace: body.pace,
    });
    console.log(`Recommended trip duration: ${duration} days`);

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Create session in database
    console.log("Creating session in database...");
    try {
      await db.insert(plannerSession).values({
        id: sessionId,
        question: body.question.trim(),
        title: extractTitle(body.question.trim()),
        pace: body.pace,
        budget: body.budget,
        focus: body.focus,
        duration, // Save the recommended duration
        status: "processing",
      });
      console.log("Session created successfully");
    } catch (error) {
      console.error("Failed to create session:", error);
      throw error;
    }

    // Return immediately with sessionId, run discussion in background
    // Run discussion asynchronously (don't await)
    runDiscussion(body, sessionId, destinations, duration)
      .then(async (discussionResult) => {
        console.log("Discussion completed, updating database...");
        // Update session with results
        await db
          .update(plannerSession)
          .set({
            round1Proposals: discussionResult.round1,
            round2Critiques: discussionResult.round2,
            round3Consensus: discussionResult.round3,
            agreements: JSON.stringify(discussionResult.round3.agreements),
            disagreements: JSON.stringify(discussionResult.round3.disagreements),
            recommendation: discussionResult.round3.recommendation,
            status: "completed",
          })
          .where(eq(plannerSession.id, sessionId));
        console.log("Database updated successfully");
      })
      .catch(async (error) => {
        console.error("Discussion failed:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        // Update session with failed status
        try {
          await db.update(plannerSession)
            .set({ status: "failed" })
            .where(eq(plannerSession.id, sessionId));
          console.log("Status updated to 'failed'");
        } catch (dbError) {
          console.error("Failed to update status to 'failed':", dbError);
        }
      });

    return NextResponse.json({
      sessionId,
      status: "processing",
      message: "Discussion started",
      duration, // Include duration in response for frontend use
    });
  } catch (error) {
    console.error("Error in /api/discuss:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
