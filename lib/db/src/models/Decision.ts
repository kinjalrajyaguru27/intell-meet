import mongoose, { Schema, type Document } from "mongoose";

export interface IDecision extends Document {
  meetingId: mongoose.Types.ObjectId;
  decision: string;
  owner: string;
  timestamp: Date;
  impact: "Low" | "Medium" | "High";
  relatedTasks: string[];
}

const DecisionSchema: Schema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  decision: { type: String, required: true },
  owner: { type: String, default: "All" },
  timestamp: { type: Date, default: Date.now },
  impact: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  relatedTasks: [{ type: String }],
});

export const Decision =
  mongoose.models.Decision ||
  mongoose.model<IDecision>("Decision", DecisionSchema);
