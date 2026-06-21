import mongoose, { Schema, type Document } from "mongoose";

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  entityId: mongoose.Types.ObjectId;
  entityType: string;
  details?: string;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  entityType: { type: String, required: true },
  details: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
