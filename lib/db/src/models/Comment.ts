import mongoose, { Schema, type Document } from "mongoose";

export interface IComment extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  parentCommentId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const CommentSchema: Schema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  text: { type: String, required: true },
  parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  createdAt: { type: Date, default: Date.now },
});

export const Comment =
  mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);
