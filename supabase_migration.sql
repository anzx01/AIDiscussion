-- ============================================
-- Database Migration: Add title and isPinned columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add title column (nullable first)
ALTER TABLE "planner_session"
ADD COLUMN IF NOT EXISTS "title" text;

-- Step 2: Add is_pinned column
ALTER TABLE "planner_session"
ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false NOT NULL;

-- Step 3: Update existing rows to have a title based on question
UPDATE "planner_session"
SET "title" = SUBSTRING("question" FROM 1 FOR 100)
WHERE "title" IS NULL;

-- Step 4: Make title NOT NULL
ALTER TABLE "planner_session"
ALTER COLUMN "title" SET NOT NULL;

-- Verification query (optional)
SELECT "id", "title", "is_pinned", "question"
FROM "planner_session"
LIMIT 5;
