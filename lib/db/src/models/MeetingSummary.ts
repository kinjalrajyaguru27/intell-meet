import mongoose, { Schema, type Document } from "mongoose";

export interface IMeetingSummary extends Document {
  meetingId: mongoose.Types.ObjectId;
  summaryType: "Short" | "Detailed" | "Management" | "Client";
  shortSummary: string;
  detailedSummary: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  outcomes: string[];
  highlights: string[];
  risks: string[];
  opportunities: string[];
  createdAt: Date;
}

const MeetingSummarySchema: Schema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  summaryType: { type: String, enum: ["Short", "Detailed", "Management", "Client"], required: true },
  shortSummary: { type: String, default: "" },
  detailedSummary: { type: String, default: "" },
  executiveSummary: { type: String, default: "" },
  keyPoints: [{ type: String }],
  decisions: [{ type: String }],
  outcomes: [{ type: String }],
  highlights: [{ type: String }],
  risks: [{ type: String }],
  opportunities: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const MeetingSummary =
  mongoose.models.MeetingSummary ||
  mongoose.model<IMeetingSummary>("MeetingSummary", MeetingSummarySchema);
