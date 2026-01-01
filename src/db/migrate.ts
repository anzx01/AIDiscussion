import { db } from "./index";
import { sql } from "drizzle-orm";

export async function ensureMessageRoleColumn() {
  try {
    console.log("Checking if message_role column exists...");

    // Check if the column exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'discussion_messages'
      AND column_name = 'role'
    `);

    if (result.length === 0) {
      console.log("Column 'role' does not exist. Adding it...");

      // Create enum type if not exists
      await db.execute(sql`CREATE TYPE IF NOT EXISTS "message_role" AS ENUM('user', 'assistant');`);

      // Alter columns
      await db.execute(sql`ALTER TABLE "discussion_messages" ALTER COLUMN "agent_id" DROP NOT NULL;`);
      await db.execute(sql`ALTER TABLE "discussion_messages" ALTER COLUMN "round" DROP NOT NULL;`);
      await db.execute(sql`ALTER TABLE "discussion_messages" ADD COLUMN IF NOT EXISTS "role" "message_role" DEFAULT 'assistant' NOT NULL;`);

      console.log("✅ Migration completed: Added 'role' column to discussion_messages table");
    } else {
      console.log("✅ Column 'role' already exists");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    // Don't throw - allow app to continue even if migration fails
  }
}
