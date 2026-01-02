import { NextRequest, NextResponse } from "next/server";
import { extractEntitiesFromMessage } from "@/lib/entity-extraction";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context, question } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("[API /extract-entities] Processing request:", {
      messageLength: message.length,
      contextLength: context?.length || 0,
      questionLength: question?.length || 0,
    });

    // Extract entities using the server-side function (now returns ExtractionResult)
    const result = await extractEntitiesFromMessage(
      message,
      context || "",
      question || ""
    );

    console.log("[API /extract-entities] Successfully extracted result:", {
      destinations: result.destinations.length,
      entities: result.entities.length
    });

    return NextResponse.json({
      destinations: result.destinations,
      entities: result.entities
    });
  } catch (error) {
    console.error("[API /extract-entities] Error:", error);
    return NextResponse.json(
      { error: "Failed to extract entities", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
