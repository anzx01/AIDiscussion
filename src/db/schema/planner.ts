import { pgTable, text, timestamp, json } from "drizzle-orm/pg-core";

export const plannerSession = pgTable("planner_session", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  pace: text("pace").notNull(), // fast | balanced | relaxed
  budget: text("budget").notNull(), // budget-conscious | flexible
  focus: text("focus").notNull(), // experience-first | practical

  // Discussion results (stored as JSON)
  round1Proposals: json("round1_proposals"), // Independent proposals
  round2Critiques: json("round2_critiques"), // Critiques
  round3Consensus: json("round3_consensus"), // Final consensus

  // Final result
  agreements: text("agreements"), // JSON array string
  disagreements: text("disagreements"), // JSON array string
  recommendation: text("recommendation"), // JSON string with itinerary

  status: text("status").notNull().default("pending"), // pending | processing | completed | failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const emailCapture = pgTable("email_capture", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  sessionId: text("session_id"), // Optional: associate with specific session
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PlannerSessionType = typeof plannerSession.$inferSelect;
export type EmailCaptureType = typeof emailCapture.$inferSelect;
