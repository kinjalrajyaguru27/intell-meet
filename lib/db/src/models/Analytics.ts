import mongoose, { Schema, type Document } from "mongoose";

export interface IAnalytics extends Document {
  entityId?: mongoose.Types.ObjectId | null;
  entityType: "Team" | "User" | "Project" | "Meeting" | "Organization" | "Platform";
  metrics: Map<string, any>;
  timestamp: Date;
}

const AnalyticsSchema: Schema = new Schema({
  entityId: { type: Schema.Types.ObjectId, default: null, index: true },
  entityType: {
    type: String,
    enum: ["Team", "User", "Project", "Meeting", "Organization", "Platform"],
    required: true,
  },
  metrics: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const Analytics =
  mongoose.models.Analytics ||
  mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);
