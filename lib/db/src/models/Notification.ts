import mongoose, { Schema, type Document } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: "mention" | "reply" | "message" | "file_upload" | "task_assignment" | "meeting_reminder";
  title: string;
  content: string;
  isRead: boolean;
  link?: string; // Optional URL path to navigate user on click
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["mention", "reply", "message", "file_upload", "task_assignment", "meeting_reminder"],
    required: true,
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
