import mongoose, { Schema, type Document } from "mongoose";

export interface IAIActionItem extends Document {
  meetingId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId | null;
  title: string;
  description: string;
  assignee: mongoose.Types.ObjectId | null;
  assigneeName: string;
  dueDate: string | null;
  priority: "Low" | "Medium" | "High";
  status: "Todo" | "In Progress" | "Done";
  createdAt: Date;
}

const ActionItemSchema: Schema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  taskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  assignee: { type: Schema.Types.ObjectId, ref: "User", default: null },
  assigneeName: { type: String, default: "" },
  dueDate: { type: String, default: null },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Todo", "In Progress", "Done"], default: "Todo" },
  createdAt: { type: Date, default: Date.now },
});

export const ActionItem =
  mongoose.models.ActionItem ||
  mongoose.model<IAIActionItem>("ActionItem", ActionItemSchema);
