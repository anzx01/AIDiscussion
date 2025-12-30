import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvent } from "@/db/schema/analytics";

/**
 * Analytics Event Tracking API
 *
 * Tracks user behavior events as specified in the requirements:
 * - first_input_submitted
 * - discussion_viewed_over_30s
 * - parameters_adjusted
 * - result_scrolled_to_bottom
 * - email_collected
 */

interface AnalyticsRequest {
  eventType:
    | "first_input_submitted"
    | "discussion_viewed_over_30s"
    | "parameters_adjusted"
    | "result_scrolled_to_bottom"
    | "email_collected";
  sessionId: string;
  metadata?: Record<string, any>;
}

const VALID_EVENT_TYPES = [
  "first_input_submitted",
  "discussion_viewed_over_30s",
  "parameters_adjusted",
  "result_scrolled_to_bottom",
  "email_collected",
];

export async function POST(req: NextRequest) {
  try {
    const body: AnalyticsRequest = await req.json();

    // Validate event type
    if (!body.eventType || !VALID_EVENT_TYPES.includes(body.eventType)) {
      return NextResponse.json(
        {
          error: "Invalid event type",
          validTypes: VALID_EVENT_TYPES,
        },
        { status: 400 }
      );
    }

    // Validate session ID
    if (!body.sessionId || body.sessionId.trim().length === 0) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Generate event ID
    const eventId = crypto.randomUUID();

    // Store event in database
    await db.insert(analyticsEvent).values({
      id: eventId,
      eventType: body.eventType,
      sessionId: body.sessionId,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    });

    return NextResponse.json({
      success: true,
      eventId,
      message: "Event tracked successfully",
    });
  } catch (error) {
    console.error("Error in /api/analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
