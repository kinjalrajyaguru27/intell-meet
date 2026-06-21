import mongoose, { Schema, type Document } from "mongoose";

export interface IMilestone extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  dueDate: Date;
  status: "Active" | "Completed";
  createdAt: Date;
}

const MilestoneSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ["Active", "Completed"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
});

export const Milestone =
  mongoose.models.Milestone ||
  mongoose.model<IMilestone>("Milestone", MilestoneSchema);
