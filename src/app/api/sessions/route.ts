import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession, discussionMessage } from "@/db/schema/planner";
import { desc, count, eq } from "drizzle-orm";
import { extractTitle, formatRelativeTime } from "@/lib/title-extractor";

/**
 * GET /api/sessions
 *
 * Fetch all discussion sessions with titles and metadata
 */
export async function GET(req: NextRequest) {
  try {
    console.log("=== GET /api/sessions called ===");

    // Fetch all sessions with message counts
    const sessions = await db
      .select({
        id: plannerSession.id,
        question: plannerSession.question,
        status: plannerSession.status,
        pace: plannerSession.pace,
        budget: plannerSession.budget,
        focus: plannerSession.focus,
        createdAt: plannerSession.createdAt,
        updatedAt: plannerSession.updatedAt,
        messageCount: count(discussionMessage.id),
      })
      .from(plannerSession)
      .leftJoin(discussionMessage, eq(plannerSession.id, discussionMessage.sessionId))
      .groupBy(plannerSession.id)
      .orderBy(desc(plannerSession.createdAt));

    console.log(`Found ${sessions.length} sessions`);

    // Transform sessions to add titles and formatted times
    const transformedSessions = sessions.map((session) => ({
      id: session.id,
      question: session.question,
      title: extractTitle(session.question),
      status: session.status,
      pace: session.pace,
      budget: session.budget,
      focus: session.focus,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      relativeTime: formatRelativeTime(session.createdAt),
      messageCount: session.messageCount || 0,
    }));

    return NextResponse.json({
      sessions: transformedSessions,
      total: transformedSessions.length,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
