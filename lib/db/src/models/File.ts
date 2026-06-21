import mongoose, { Schema, type Document } from "mongoose";

export interface IFile extends Document {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  channel?: mongoose.Types.ObjectId;
  meeting?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FileSchema: Schema = new Schema({
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  channel: { type: Schema.Types.ObjectId, ref: "Channel", index: true },
  meeting: { type: Schema.Types.ObjectId, ref: "Meeting", index: true },
  createdAt: { type: Date, default: Date.now },
});

export const FileModel = mongoose.models.File || mongoose.model<IFile>("File", FileSchema);
