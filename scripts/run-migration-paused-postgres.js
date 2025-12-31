/**
 * Migration runner using postgres package (same as project)
 */

const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.log("\nPlease create a .env file with:");
  console.log("DATABASE_URL=\"postgresql://user:password@host:port/database\"");
  process.exit(1);
}

async function runMigration() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log("✅ Connected to database");

    // Read SQL file
    const sqlFile = path.join(__dirname, "../drizzle/0003_add_paused_field.sql");
    const sqlCommand = fs.readFileSync(sqlFile, "utf8").trim();

    console.log("Running migration:", sqlFile);
    console.log("SQL:", sqlCommand);

    // Execute SQL
    await sql.unsafe(sqlCommand);

    console.log("\n✅ Migration completed successfully!");
    console.log("✅ Added is_paused column to planner_session table");

    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'planner_session'
      AND column_name = 'is_paused'
    `;

    if (result.length > 0) {
      console.log("\n📊 Column info:");
      console.log(result[0]);
    }

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await sql.end();
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
