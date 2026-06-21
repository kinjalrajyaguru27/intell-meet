import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rajyagurukinjal27_db_user:db_user@intell-meet-cluster.ebbde1m.mongodb.net/intell_meet?retryWrites=true&w=majority";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("Connected to MongoDB successfully");
  } catch (error: any) {
    console.warn("MongoDB connection failed:", error.message || error);
    if (MONGODB_URI !== "mongodb://localhost:27017/intell_meet") {
      console.warn("Falling back to local MongoDB database: mongodb://localhost:27017/intell_meet");
      try {
        await mongoose.connect("mongodb://localhost:27017/intell_meet", {
          serverSelectionTimeoutMS: 5000
        });
        console.log("Connected to local MongoDB successfully");
        return;
      } catch (localError: any) {
        console.error("Local MongoDB connection also failed:", localError.message || localError);
        throw localError;
      }
    }
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

