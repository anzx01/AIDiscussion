/**
 * Migration script to add is_paused field to planner_session table
 * Uses Drizzle ORM
 */

const { migrate } = require("drizzle-orm/postgres-js/migrator");
const { db } = require("../src/db");

async function runMigration() {
  try {
    console.log("Running migration to add is_paused field...");

    // Run the SQL directly
    await db.execute(`
      ALTER TABLE planner_session
      ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false NOT NULL
    `);

    console.log("✅ Migration completed successfully!");
    console.log("Added is_paused column to planner_session table");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log("\n✅ Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
