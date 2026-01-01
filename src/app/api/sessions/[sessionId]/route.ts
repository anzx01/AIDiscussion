import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession, discussionMessage } from "@/db/schema/planner";
import { eq, and, desc } from "drizzle-orm";

// PATCH /api/sessions/[sessionId] - Rename session
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await db
      .update(plannerSession)
      .set({ title })
      .where(eq(plannerSession.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error renaming session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[sessionId] - Delete session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Delete all messages first
    await db
      .delete(discussionMessage)
      .where(eq(discussionMessage.sessionId, sessionId));

    // Delete the session
    await db
      .delete(plannerSession)
      .where(eq(plannerSession.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
