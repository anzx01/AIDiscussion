ALTER TABLE "planner_session" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "planner_session" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Update existing rows to have a title based on question
UPDATE "planner_session" SET "title" = substring("question" from 1 for 100) WHERE "title" IS NULL;--> statement-breakpoint
-- Now make title NOT NULL
ALTER TABLE "planner_session" ALTER COLUMN "title" SET NOT NULL;