CREATE TABLE "analytics_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"session_id" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_capture" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_capture_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "planner_session" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"pace" text NOT NULL,
	"budget" text NOT NULL,
	"focus" text NOT NULL,
	"round1_proposals" json,
	"round2_critiques" json,
	"round3_consensus" json,
	"agreements" text,
	"disagreements" text,
	"recommendation" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
