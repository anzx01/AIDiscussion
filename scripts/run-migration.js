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

async function runMigration() {
  try {
    console.log("Creating tables...");

    // Create planner_session table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "planner_session" (
        "id" text PRIMARY KEY NOT NULL,
        "question" text NOT NULL,
        "pace" text NOT NULL,
        "budget" text NOT NULL,
        "focus" text NOT NULL,
        "round1_proposals" json,
        "round2_critiques" json,
        "round3_consensus" json,
        "agreements" text,
        "disagreements" text,
        "recommendation" text,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now()
      );
    `);
    console.log("✓ planner_session table created");

    // Create analytics_event table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "analytics_event" (
        "id" text PRIMARY KEY NOT NULL,
        "event_type" text NOT NULL,
        "session_id" text NOT NULL,
        "metadata" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✓ analytics_event table created");

    // Create email_capture table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "email_capture" (
        "id" text PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "session_id" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "email_capture_email_unique" UNIQUE("email")
      );
    `);
    console.log("✓ email_capture table created");

    console.log("All tables created successfully!");
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create tables:", error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
