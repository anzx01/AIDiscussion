-- Create discussion_messages table for chat-style interface
CREATE TABLE IF NOT EXISTS "discussion_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL REFERENCES planner_session(id),
  "agent_id" text NOT NULL,
  "round" integer NOT NULL,
  "content" text NOT NULL,
  "reply_to_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS "idx_messages_session_round" ON "discussion_messages"("session_id", "round", "created_at");
