import mongoose, { Schema, type Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  description: string;
  teamId: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  dueDate: string | null;
  status: "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Critical";
  createdAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  dueDate: { type: String, default: null },
  status: {
    type: String,
    enum: ["Planning", "Active", "On Hold", "Completed", "Cancelled"],
    default: "Planning",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Project =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
