CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
ALTER TABLE "discussion_messages" ALTER COLUMN "agent_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "discussion_messages" ALTER COLUMN "round" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "discussion_messages" ADD COLUMN "role" "message_role" DEFAULT 'assistant' NOT NULL;