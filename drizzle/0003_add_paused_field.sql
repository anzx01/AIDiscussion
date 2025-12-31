-- Migration: Add is_paused field to planner_session table
-- Date: 2025-12-31

-- Add is_paused column to support pause/resume functionality
ALTER TABLE planner_session
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false NOT NULL;
