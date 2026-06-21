import mongoose, { Schema, type Document } from "mongoose";

export interface IMeetingInsight extends Document {
  meetingId: mongoose.Types.ObjectId;
  productivityScore: number;
  engagementScore: number;
  sentimentScore: number;
  sentimentAnalysis: string;
  participationScore: number;
  speakingTimeAnalytics: Map<string, number>;
  mostActiveParticipant: string;
  leastActiveParticipant: string;
  topicAnalysis: string[];
  createdAt: Date;
}

const MeetingInsightSchema: Schema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  productivityScore: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },
  sentimentScore: { type: Number, default: 0 },
  sentimentAnalysis: { type: String, default: "" },
  participationScore: { type: Number, default: 0 },
  speakingTimeAnalytics: { type: Map, of: Number, default: {} },
  mostActiveParticipant: { type: String, default: "" },
  leastActiveParticipant: { type: String, default: "" },
  topicAnalysis: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const MeetingInsight =
  mongoose.models.MeetingInsight ||
  mongoose.model<IMeetingInsight>("MeetingInsight", MeetingInsightSchema);
