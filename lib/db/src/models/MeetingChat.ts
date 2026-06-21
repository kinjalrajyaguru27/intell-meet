import mongoose, { Schema, type Document } from "mongoose";

export interface IMeetingChat extends Document {
  meeting: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId | null;
  displayName: string;
  message: string;
  timestamp: Date;
}

const MeetingChatSchema = new Schema({
  meeting: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", default: null },
  displayName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const MeetingChat = mongoose.models.MeetingChat || mongoose.model<IMeetingChat>("MeetingChat", MeetingChatSchema);
