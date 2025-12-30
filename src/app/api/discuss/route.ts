import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession } from "@/db/schema/planner";
import { apiConfig } from "@/lib/api-config";
import {
  getRound1Prompt,
  getRound2Prompt,
  getRound3Prompt,
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
 * Call LLM API (or use mock data)
 */
async function callLLM(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (apiConfig.useMockApi) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return "Mock response for development";
  }

  // Real API call logic would go here
  // This is a placeholder for the actual implementation
  // You would use OpenAI SDK or similar here
  return "Real API response placeholder";
}

/**
 * Run the 3-round discussion
 */
async function runDiscussion(params: DiscussRequest): Promise<{
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

  // Real discussion logic would go here
  // Round 1: Independent proposals
  const round1: Record<string, string> = {};
  for (const [key, participant] of Object.entries(PARTICIPANTS)) {
    const systemPrompt = ""; // Would get from prompts.ts
    const userPrompt = getRound1Prompt(
      key as any,
      params.question,
      params.pace,
      params.budget,
      params.focus
    );
    round1[key] = await callLLM(participant.model, systemPrompt, userPrompt);
  }

  // Round 2: Critiques
  const round2: Record<string, string> = {};
  for (const [key, participant] of Object.entries(PARTICIPANTS)) {
    const systemPrompt = ""; // Would get from prompts.ts
    const userPrompt = getRound2Prompt(key as any, round1);
    round2[key] = await callLLM(participant.model, systemPrompt, userPrompt);
  }

  // Round 3: Synthesis
  const systemPrompt = ""; // Would get from prompts.ts
  const userPrompt = getRound3Prompt(round1, round2);
  const round3Result = await callLLM(
    PARTICIPANTS.planner.model,
    systemPrompt,
    userPrompt
  );

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
    const body: DiscussRequest = await req.json();

    // Validate input
    if (!body.question || body.question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Validate that this is about 2-day NYC trip
    const lowerQuestion = body.question.toLowerCase();
    if (
      !lowerQuestion.includes("new york") &&
      !lowerQuestion.includes("nyc") &&
      !lowerQuestion.includes("new york city")
    ) {
      return NextResponse.json(
        {
          error:
            "This tool only supports 2-day New York trip planning. Please mention New York or NYC in your question.",
        },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Create session in database
    await db.insert(plannerSession).values({
      id: sessionId,
      question: body.question.trim(),
      pace: body.pace,
      budget: body.budget,
      focus: body.focus,
      status: "processing",
    });

    // Run discussion asynchronously (in production, use a background job)
    // For now, we'll do it synchronously
    const discussionResult = await runDiscussion(body);

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

    return NextResponse.json({
      sessionId,
      status: "completed",
      message: "Discussion completed successfully",
    });
  } catch (error) {
    console.error("Error in /api/discuss:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
