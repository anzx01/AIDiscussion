import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession } from "@/db/schema/planner";
import { eq } from "drizzle-orm";

// POST /api/sessions/[sessionId]/pin - Toggle pin status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Get current pin status
    const session = await db
      .select()
      .from(plannerSession)
      .where(eq(plannerSession.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Toggle pin status
    await db
      .update(plannerSession)
      .set({ isPinned: !session[0].isPinned })
      .where(eq(plannerSession.id, sessionId));

    return NextResponse.json({ success: true, isPinned: !session[0].isPinned });
  } catch (error) {
    console.error("Error pinning session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
