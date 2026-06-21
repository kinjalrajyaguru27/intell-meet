import mongoose, { Schema, type Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  status: "Backlog" | "Todo" | "In Progress" | "Review" | "Testing" | "Done";
  assignee: mongoose.Types.ObjectId | null;
  reporter?: mongoose.Types.ObjectId | null;
  dueDate: string | null;
  priority: "Low" | "Medium" | "High" | "Critical";
  projectId?: mongoose.Types.ObjectId | null;
  teamId: mongoose.Types.ObjectId | null;
  parentTaskId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Backlog", "Todo", "In Progress", "Review", "Testing", "Done"],
    default: "Todo",
    index: true,
  },
  assignee: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  reporter: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  dueDate: { type: String, default: null },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium",
    index: true,
  },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null, index: true },
  parentTaskId: { type: Schema.Types.ObjectId, ref: "Task", default: null, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Task = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
