import mongoose, { Schema, type Document } from "mongoose";

export interface IMeetingNotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: "created" | "starting_soon" | "user_joined" | "user_left" | "meeting_ended";
  title: string;
  content: string;
  isRead: boolean;
  metadata?: Schema.Types.Mixed;
  createdAt: Date;
}

const MeetingNotificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["created", "starting_soon", "user_joined", "user_left", "meeting_ended"],
    required: true,
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const MeetingNotification = mongoose.models.MeetingNotification || mongoose.model<IMeetingNotification>("MeetingNotification", MeetingNotificationSchema);
