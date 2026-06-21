import mongoose, { Schema, type Document } from "mongoose";

export interface IAttachment extends Document {
  taskId: mongoose.Types.ObjectId;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AttachmentSchema: Schema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Attachment =
  mongoose.models.Attachment ||
  mongoose.model<IAttachment>("Attachment", AttachmentSchema);
