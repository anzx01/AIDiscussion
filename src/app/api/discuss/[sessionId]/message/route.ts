import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { discussionMessage } from "@/db/schema/planner";
import { triggerAIResponse } from "../continue/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { message, selectedAgents } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!selectedAgents || !Array.isArray(selectedAgents) || selectedAgents.length === 0) {
      return NextResponse.json({ error: "At least one AI model must be selected" }, { status: 400 });
    }

    // Insert user message into the database
    const messageId = crypto.randomUUID();
    const [newMessage] = await db
      .insert(discussionMessage)
      .values({
        id: messageId,
        sessionId,
        role: "user",
        agentId: null, // User messages don't have an agent
        round: null, // User messages don't belong to a round
        content: message,
      })
      .returning();

    console.log("User message saved, triggering AI response for:", selectedAgents);

    // Trigger AI response in the background
    // Don't await - let it run asynchronously
    triggerAIResponse(sessionId, messageId, selectedAgents).catch(err => {
      console.error("Failed to trigger AI response:", err);
    });

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
