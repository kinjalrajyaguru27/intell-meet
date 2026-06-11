import { pgTable, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const meetingsTable = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: text("room_id").notNull(),
  name: text("name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  participantNames: text("participant_names").array().notNull().default([]),
});

export const insertMeetingSchema = createInsertSchema(meetingsTable).omit({ id: true });
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetingsTable.$inferSelect;

export const meetingNotesTable = pgTable("meeting_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id")
    .notNull()
    .references(() => meetingsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMeetingNotesSchema = createInsertSchema(meetingNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMeetingNotes = z.infer<typeof insertMeetingNotesSchema>;
export type MeetingNotes = typeof meetingNotesTable.$inferSelect;

export const actionItemsTable = pgTable("action_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id")
    .notNull()
    .references(() => meetingsTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  assigneeName: text("assignee_name"),
  dueDate: text("due_date"),
  isDone: boolean("is_done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActionItemSchema = createInsertSchema(actionItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type ActionItem = typeof actionItemsTable.$inferSelect;
