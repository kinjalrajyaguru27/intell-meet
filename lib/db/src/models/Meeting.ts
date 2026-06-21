import mongoose, { Schema, type Document } from "mongoose";

export interface ITranscriptLine {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface IActionItem {
  id?: string;
  text: string;
  assigneeName: string | null;
  dueDate: string | null;
  isDone: boolean;
  createdAt: Date;
}

export interface IMeeting extends Document {
  // Original fields for backward compatibility
  roomId: string; // Map to meetingId
  name: string;   // Map to title
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  participantNames: string[];
  notes: string;
  transcript: ITranscriptLine[];
  actionItems: IActionItem[];

  // New fields for enterprise video meeting
  title: string;
  description?: string;
  host?: mongoose.Types.ObjectId;
  meetingId: string; // Human readable room code (e.g. abc-defg-hij)
  password?: string;
  status: "scheduled" | "active" | "ended";
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null; // minutes/seconds
  isRecurring: boolean;
  recurrenceRule?: string;
  isPersonalRoom: boolean;
  waitingRoomEnabled: boolean;
}

const TranscriptLineSchema = new Schema({
  speaker: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
});

const ActionItemSchema = new Schema({
  text: { type: String, required: true },
  assigneeName: { type: String, default: null },
  dueDate: { type: String, default: null },
  isDone: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const MeetingSchema: Schema = new Schema({
  // Original fields
  roomId: { type: String, required: true },
  name: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  durationSeconds: { type: Number, default: null },
  participantNames: [{ type: String }],
  notes: { type: String, default: "" },
  transcript: [TranscriptLineSchema],
  actionItems: [ActionItemSchema],

  // New fields
  title: { type: String, required: true },
  description: { type: String, default: "" },
  host: { type: Schema.Types.ObjectId, ref: "User", index: true },
  meetingId: { type: String, required: true, unique: true, index: true },
  password: { type: String, default: "" },
  status: { type: String, enum: ["scheduled", "active", "ended"], default: "scheduled" },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  duration: { type: Number, default: null },
  isRecurring: { type: Boolean, default: false },
  recurrenceRule: { type: String, default: "" },
  isPersonalRoom: { type: Boolean, default: false },
  waitingRoomEnabled: { type: Boolean, default: false },
});

export const Meeting = mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", MeetingSchema);

