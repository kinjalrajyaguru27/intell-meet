import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intell_meet";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export * from "./models/User";
export * from "./models/Meeting";
export * from "./models/Task";
export * from "./models/Team";
export * from "./models/Invitation";
export * from "./models/Participant";
export * from "./models/Recording";
export * from "./models/MeetingChat";
export * from "./models/MeetingNotification";
export * from "./models/MeetingTranscript";
export * from "./models/MeetingSummary";
export * from "./models/ActionItem";
export * from "./models/MeetingInsight";
export * from "./models/Decision";
export * from "./models/Message";
export * from "./models/Channel";
export * from "./models/Notification";
export * from "./models/File";
export * from "./models/MeetingNotesVersion";
export * from "./models/Organization";
export * from "./models/Member";
export * from "./models/Project";
export * from "./models/Subtask";
export * from "./models/Comment";
export * from "./models/Attachment";
export * from "./models/Milestone";
export * from "./models/ActivityLog";
export * from "./models/Analytics";
export * from "./models/Report";
export * from "./models/Forecast";
export { mongoose };

