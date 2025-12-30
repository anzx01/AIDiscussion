import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailCapture } from "@/db/schema/planner";

/**
 * Email Capture API
 *
 * Captures user emails after they've viewed results
 */
interface EmailRequest {
  email: string;
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: EmailRequest = await req.json();

    // Validate email
    if (!body.email || body.email.trim().length === 0) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Generate ID
    const id = crypto.randomUUID();

    // Save email to database
    await db.insert(emailCapture).values({
      id,
      email: body.email.trim(),
      sessionId: body.sessionId || null,
    });

    return NextResponse.json({
      success: true,
      message: "Email captured successfully",
    });
  } catch (error) {
    console.error("Error in /api/email:", error);

    // Check for unique constraint violation (email already exists)
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json({
        success: true,
        message: "Email already registered",
      });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
