import mongoose, { Schema, type Document } from "mongoose";

export interface IRecording extends Document {
  meeting: mongoose.Types.ObjectId;
  title: string;
  fileUrl: string;
  durationSeconds: number;
  sizeBytes: number;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RecordingSchema = new Schema({
  meeting: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  durationSeconds: { type: Number, required: true },
  sizeBytes: { type: Number, required: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Recording = mongoose.models.Recording || mongoose.model<IRecording>("Recording", RecordingSchema);
