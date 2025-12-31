const postgres = require("postgres");
const fs = require("fs");
const path = require("path");
// Read .env file manually
const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const [key, ...valueParts] = line.split("=");
  if (key && !key.startsWith("#") && valueParts.length > 0) {
    const value = valueParts.join("=").trim().replace(/^"|"$/g, "");
    envVars[key.trim()] = value;
  }
});

const sql = postgres(envVars.DATABASE_URL);

async function runMigrations() {
  try {
    console.log("Running migrations...");

    // Read migration files
    const migrationDir = path.join(process.cwd(), "drizzle");
    const files = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      console.log(`Executing ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationDir, file), "utf8");

      // Split by statement breakpoint and execute each
      const statements = sqlContent.split("--> statement-breakpoint");
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed && !trimmed.startsWith("--")) {
          await sql.unsafe(trimmed);
        }
      }

      console.log(`✓ ${file} completed`);
    }

    console.log("All migrations completed successfully!");
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await sql.end();
    process.exit(1);
  }
}

runMigrations();
