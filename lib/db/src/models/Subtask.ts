import mongoose, { Schema, type Document } from "mongoose";

export interface ISubtask extends Document {
  parentTaskId: mongoose.Types.ObjectId;
  childTaskId: mongoose.Types.ObjectId;
}

const SubtaskSchema: Schema = new Schema({
  parentTaskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  childTaskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
});

export const Subtask =
  mongoose.models.Subtask ||
  mongoose.model<ISubtask>("Subtask", SubtaskSchema);
