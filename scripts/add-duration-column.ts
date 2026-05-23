import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function addDurationColumn() {
  try {
    console.log("Adding duration column to planner_session table...");

    // Check if column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'planner_session'
      AND column_name = 'duration'
    `);

    if (checkResult.length > 0) {
      console.log("Column 'duration' already exists. Skipping migration.");
      return;
    }

    // Add the column
    await db.execute(sql`
      ALTER TABLE "planner_session"
      ADD COLUMN "duration" integer
    `);

    console.log("✓ Successfully added 'duration' column to planner_session table");
  } catch (error) {
    console.error("Error adding duration column:", error);
    throw error;
  }
}

// Run the migration
addDurationColumn()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
