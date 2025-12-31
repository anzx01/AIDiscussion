CREATE TABLE "discussion_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"round" integer NOT NULL,
	"content" text NOT NULL,
	"reply_to_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner_session" ADD COLUMN "is_paused" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "discussion_messages" ADD CONSTRAINT "discussion_messages_session_id_planner_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."planner_session"("id") ON DELETE no action ON UPDATE no action;