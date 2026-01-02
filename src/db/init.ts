import { db } from "./index";
import { sql } from "drizzle-orm";

/**
 * Initialize database schema
 * This ensures that all required columns exist
 */
export async function initializeDatabase() {
  try {
    console.log("[DB Init] Checking database schema...");

    // Check if duration column exists in planner_session
    const checkResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'planner_session'
      AND column_name = 'duration'
    `);

    if (checkResult.rows.length === 0) {
      console.log("[DB Init] Adding 'duration' column to planner_session table...");
      await db.execute(sql`
        ALTER TABLE "planner_session"
        ADD COLUMN "duration" integer
      `);
      console.log("[DB Init] ✓ Successfully added 'duration' column");
    } else {
      console.log("[DB Init] 'duration' column already exists");
    }

    console.log("[DB Init] Database schema up to date");
  } catch (error) {
    console.error("[DB Init] Error initializing database:", error);
    // Don't throw - allow app to continue even if init fails
  }
}
