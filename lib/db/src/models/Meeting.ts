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

export interface INoteAttachment {
  id: string;
  name: string;
  url: string;
  size?: string;
  type?: string;
  addedAt?: string;
}

export interface INoteItem {
  id: string;
  title?: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  visibility: "everyone" | "selected";
  allowedViewers: string[];
  attachments: INoteAttachment[];
}

export interface INotesPermissions {
  mode: "everyone" | "host_only" | "selected";
  allowedEditors: string[];
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
  notesPermissions?: INotesPermissions;
  notesList?: INoteItem[];
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
  organizationId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
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

const NoteAttachmentSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: String, default: "" },
  type: { type: String, default: "file" },
  addedAt: { type: String, default: "" },
});

const NoteItemSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  authorId: { type: String, default: "" },
  authorName: { type: String, default: "" },
  createdAt: { type: String, default: "" },
  updatedAt: { type: String, default: "" },
  visibility: { type: String, enum: ["everyone", "selected"], default: "everyone" },
  allowedViewers: [{ type: String }],
  attachments: [NoteAttachmentSchema],
});

const NotesPermissionsSchema = new Schema({
  mode: { type: String, enum: ["everyone", "host_only", "selected"], default: "everyone" },
  allowedEditors: [{ type: String }],
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
  notesPermissions: { type: NotesPermissionsSchema, default: () => ({ mode: "everyone", allowedEditors: [] }) },
  notesList: { type: [NoteItemSchema], default: [] },
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
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
});

export const Meeting = mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", MeetingSchema);

