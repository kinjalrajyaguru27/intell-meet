import mongoose, { Schema, type Document } from "mongoose";

export interface IMeetingNotesVersion extends Document {
  meetingId: mongoose.Types.ObjectId;
  content: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MeetingNotesVersionSchema: Schema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const MeetingNotesVersion = mongoose.models.MeetingNotesVersion || mongoose.model<IMeetingNotesVersion>("MeetingNotesVersion", MeetingNotesVersionSchema);
