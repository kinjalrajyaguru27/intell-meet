import mongoose, { Schema, type Document } from "mongoose";

export interface IMeetingTranscript extends Document {
  meetingId: mongoose.Types.ObjectId;
  speaker: string;
  text: string;
  timestamp: number;
}

const MeetingTranscriptSchema: Schema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  speaker: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
});

export const MeetingTranscript =
  mongoose.models.MeetingTranscript ||
  mongoose.model<IMeetingTranscript>("MeetingTranscript", MeetingTranscriptSchema);
