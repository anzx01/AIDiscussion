import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession } from "@/db/schema/planner";
import { eq } from "drizzle-orm";

/**
 * Get Session API
 *
 * Retrieves a single planner session by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Fetch session from database
    const sessions = await db
      .select()
      .from(plannerSession)
      .where(eq(plannerSession.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const session = sessions[0];

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error in /api/session/[sessionId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
