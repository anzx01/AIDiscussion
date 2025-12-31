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

/**
 * Multi-Model Discussion API
 *
 * This endpoint orchestrates a 3-round discussion between multiple AI models
 * to generate a comprehensive 2-day New York trip plan.
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
    planner: `Day 1:
- Morning: Start at Times Square (9:00 AM), walk to Rockefeller Center (10:00 AM), visit Top of the Rock (10:30 AM)
- Afternoon: Lunch at nearby deli (12:30 PM), MoMA visit (2:00 PM), Central Park walk (4:00 PM)
- Evening: Dinner in Hell's Kitchen (7:00 PM), Broadway show (8:00 PM)

Day 2:
- Morning: Statue of Liberty & Ellis Island (9:00 AM - 1:00 PM)
- Afternoon: Wall Street walk (1:30 PM), 9/11 Memorial (2:30 PM), Oculus (3:30 PM)
- Evening: Brooklyn Bridge sunset (5:00 PM), dinner in DUMBO (7:00 PM)

Notes: Focus on iconic first-time NYC experiences with efficient geographic clustering.`,

    realityChecker: `Day 1:
- Morning: Central Park start (9:00 AM) - less crowded, Metropolitan Museum (10:00 AM)
- Afternoon: Lunch on Upper East Side (1:00 PM), Guggenheim (2:30 PM), walk down Fifth Avenue (4:00 PM)
- Evening: Empire State Building sunset (6:00 PM), Koreatown dinner (8:00 PM)

Day 2:
- Morning: Early ferry to Statue of Liberty (8:00 AM to beat crowds)
- Afternoon: Financial District walk (11:00 AM), 9/11 Memorial (12:00 PM - can be very crowded), Chelsea Market lunch (2:00 PM)
- Evening: High Line park walk (4:00 PM), Hudson Yards (5:30 PM), West Village dinner (7:00 PM)

Notes: Avoid Times Square during peak hours. Book Broadway tickets in advance. Statue of Liberty security takes 30+ minutes.`,

    budgetAdvisor: `Day 1:
- Morning: Staten Island Ferry for free Statue of Liberty views (9:00 AM), walk to Financial District (10:30 AM)
- Afternoon: Free 9/11 Memorial (11:00 AM), inexpensive lunch in Chinatown (1:00 PM), Brooklyn Bridge walk (2:30 PM)
- Evening: Sunset at Brooklyn Bridge Park (5:00 PM), affordable dinner in Sunset Park (7:00 PM)

Day 2:
- Morning: Central Park (free) (9:00 AM), walk through Midtown (11:00 AM)
- Afternoon: Free sample of MoMA on Friday evenings (regular time: 2:00 PM), Times Square (free experience) (4:00 PM)
- Evening: Street food dinner (6:00 PM), free walk across Manhattan Bridge (8:00 PM)

Notes: Use free alternatives like Staten Island Ferry instead of paid Liberty tour. Eat at ethnic neighborhoods for authentic, cheap food. Many museums have pay-what-you-wish hours.`,
  },

  round2: {
    planner: `Reality Checker's Proposal: Good crowd timing advice, but Top of the Rock and Empire State in one day is redundant. Central Park clustering is better.
Budget Advisor's Proposal: Too much free stuff misses the point of a "special" trip. Staten Island Ferry is practical but doesn't feel like a destination experience.`,

    realityChecker: `Planner's Proposal: Times Square at 9 AM still has crowds. Broadway show without mentioning booking timeline is unrealistic - shows sell out weeks ahead.
Budget Advisor's Proposal: Staten Island Ferry is smart for views, but Chinatown to Brooklyn Bridge is a lot of walking. MoMA "free" is only 4 hours Friday - need to mention that limitation.`,

    budgetAdvisor: `Planner's Proposal: Top of the Rock ($40+) and MoMA ($30) plus Broadway ($100+) is $200+ just for these three. No mention of these costs.
Reality Checker's Proposal: Met Museum "pay what you wish" is only for NY residents. Need to flag this - full price is $30 for adults. Good timing advice though.`,
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
    recommendation: "Mock recommendation - in production this would be the synthesized output from Round 3",
  },
};

/**
 * Call LLM API (supports both Zhipu AI and DeepSeek)
 */
async function callLLM(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  provider: "zhipu" | "deepseek"
): Promise<string> {
  console.log(`callLLM: provider=${provider}, model=${model}`);

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
        max_tokens: 2000,
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
  sessionId: string
): Promise<{
  round1: Record<string, string>;
  round2: Record<string, string>;
  round3: {
    agreements: string[];
    disagreements: string[];
    recommendation: string;
  };
}> {
  if (apiConfig.useMockApi) {
    // Return mock data for development
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return MOCK_DISCUSSION;
  }

  // Round 1: Independent proposals
  console.log("Starting Round 1...");
  const round1: Record<string, string> = {};
  const round1MessageIds: Record<string, string> = {};
  for (const [key, participant] of Object.entries(PARTICIPANTS)) {
    console.log(`Round 1: ${key} proposing...`);
    const systemPrompt = getSystemPrompt(key as any);
    const userPrompt = getRound1Prompt(
      key as any,
      params.question,
      params.pace,
      params.budget,
      params.focus
    );
    round1[key] = await callLLM(
      participant.model,
      systemPrompt,
      userPrompt,
      participant.provider
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
    const systemPrompt = getSystemPrompt(key as any);
    const userPrompt = getRound2Prompt(key as any, round1);
    round2[key] = await callLLM(
      participant.model,
      systemPrompt,
      userPrompt,
      participant.provider
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
  const systemPrompt = getSystemPrompt("planner");
  const userPrompt = getRound3Prompt(round1, round2);
  const round3Result = await callLLM(
    PARTICIPANTS.planner.model,
    systemPrompt,
    userPrompt,
    PARTICIPANTS.planner.provider
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

    // Validate that this is about 2-day NYC trip
    const lowerQuestion = body.question.toLowerCase();
    const hasNewYork =
      lowerQuestion.includes("new york") ||
      lowerQuestion.includes("newyork") ||
      lowerQuestion.includes("nyc") ||
      lowerQuestion.includes("new york city");

    if (!hasNewYork) {
      return NextResponse.json(
        {
          error:
            "This tool only supports 2-day New York trip planning. Please mention New York, NYC, or NewYork in your question.",
        },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Create session in database
    console.log("Creating session in database...");
    try {
      await db.insert(plannerSession).values({
        id: sessionId,
        question: body.question.trim(),
        pace: body.pace,
        budget: body.budget,
        focus: body.focus,
        status: "processing",
      });
      console.log("Session created successfully");
    } catch (error) {
      console.error("Failed to create session:", error);
      throw error;
    }

    // Return immediately with sessionId, run discussion in background
    // Run discussion asynchronously (don't await)
    runDiscussion(body, sessionId)
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
      .catch((error) => {
        console.error("Discussion failed:", error);
        // Update session with failed status
        db.update(plannerSession)
          .set({ status: "failed" })
          .where(eq(plannerSession.id, sessionId));
      });

    return NextResponse.json({
      sessionId,
      status: "processing",
      message: "Discussion started",
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
