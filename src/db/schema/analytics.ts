import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const analyticsEvent = pgTable("analytics_event", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(), // first_input_submitted, discussion_viewed_over_30s, etc.
  sessionId: text("session_id").notNull(), // 关联到 planner session
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnalyticsEventType = typeof analyticsEvent.$inferSelect;
