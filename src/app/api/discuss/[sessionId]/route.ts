import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession, discussionMessage } from "@/db/schema/planner";
import { eq, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    console.log("=== GET /api/discuss/[sessionId] called ===");
    const { sessionId } = await params;
    console.log("Fetching session:", sessionId);

    const session = await db
      .select()
      .from(plannerSession)
      .where(eq(plannerSession.id, sessionId))
      .limit(1);

    console.log("Session query result:", session.length, "rows");

    if (session.length === 0) {
      console.log("Session not found:", sessionId);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log("Fetching messages...");
    // Fetch messages in chronological order
    const messages = await db
      .select()
      .from(discussionMessage)
      .where(eq(discussionMessage.sessionId, sessionId))
      .orderBy(asc(discussionMessage.createdAt));

    console.log("Messages query result:", messages.length, "rows");

    const responseData = {
      sessionId: session[0].id,
      status: session[0].status,
      question: session[0].question,
      pace: session[0].pace,
      budget: session[0].budget,
      focus: session[0].focus,
      messages: messages,
      // Legacy fields for backward compatibility
      round1Proposals: session[0].round1Proposals,
      round2Critiques: session[0].round2Critiques,
      round3Consensus: session[0].round3Consensus,
      recommendation: session[0].recommendation,
      agreements: session[0].agreements,
      disagreements: session[0].disagreements,
    };

    console.log("Returning response with status:", session[0].status);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching session:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
