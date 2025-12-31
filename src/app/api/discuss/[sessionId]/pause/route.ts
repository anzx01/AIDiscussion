import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession } from "@/db/schema/planner";
import { eq } from "drizzle-orm";

/**
 * POST /api/discuss/[sessionId]/pause
 *
 * Toggle pause/resume state for a discussion session
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    console.log("=== POST /api/discuss/[sessionId]/pause called ===");
    const { sessionId } = await params;

    const body = await req.json();
    const { action } = body; // "pause" or "resume"

    console.log("Session:", sessionId, "Action:", action);

    // Get current session
    const sessions = await db
      .select()
      .from(plannerSession)
      .where(eq(plannerSession.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    // Update isPaused based on action
    const newPausedState = action === "pause";

    await db
      .update(plannerSession)
      .set({ isPaused: newPausedState })
      .where(eq(plannerSession.id, sessionId));

    console.log(
      `Session ${sessionId} ${newPausedState ? "paused" : "resumed"}`
    );

    return NextResponse.json({
      success: true,
      isPaused: newPausedState,
      action,
    });
  } catch (error) {
    console.error("Error toggling pause:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/discuss/[sessionId]/pause
 *
 * Get current pause state
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const sessions = await db
      .select({ isPaused: plannerSession.isPaused })
      .from(plannerSession)
      .where(eq(plannerSession.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      isPaused: sessions[0].isPaused,
    });
  } catch (error) {
    console.error("Error getting pause state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
