/**
 * Simple migration runner using node-postgres
 * Install: npm install pg
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env" });

// Use environment variable or fallback
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.log("\nPlease set it in your .env file:");
  console.log("DATABASE_URL=\"postgresql://user:password@host:port/database\"");
  process.exit(1);
}

async function runMigration() {
  const pg = require("pg");
  const { Client } = pg;

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Read SQL file
    const sqlFile = path.join(__dirname, "../drizzle/0003_add_paused_field.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    console.log("Running migration:", sqlFile);

    // Execute SQL
    await client.query(sql);

    console.log("✅ Migration completed successfully!");
    console.log("✅ Added is_paused column to planner_session table");

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'planner_session'
      AND column_name = 'is_paused'
    `);

    if (result.rows.length > 0) {
      console.log("\n📊 Column info:");
      console.log(result.rows[0]);
    }

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration()
  .then(() => {
    console.log("\n✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error.message);
    process.exit(1);
  });
