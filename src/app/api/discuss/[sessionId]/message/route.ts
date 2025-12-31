import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { discussionMessage } from "@/db/schema/planner";
import { eq, asc } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Insert user message into the database
    const [newMessage] = await db
      .insert(discussionMessage)
      .values({
        sessionId,
        agentId: "user",
        content: message,
        role: "user",
        round: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
