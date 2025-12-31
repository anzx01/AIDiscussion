/**
 * Migration script to add is_paused field to planner_session table
 */

const { Client } = require("pg");

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'planner_session'
      AND column_name = 'is_paused'
    `);

    if (checkColumn.rows.length > 0) {
      console.log("Column is_paused already exists. Skipping migration.");
      return;
    }

    // Add is_paused column
    console.log("Adding is_paused column to planner_session table...");
    await client.query(`
      ALTER TABLE planner_session
      ADD COLUMN is_paused BOOLEAN DEFAULT false NOT NULL
    `);

    console.log("✅ Migration completed successfully!");
    console.log("Added is_paused column to planner_session table");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log("\n✅ All migrations completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
