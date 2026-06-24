import mongoose from "mongoose";

// Cached connection for serverless environment
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://rajyagurukinjal27_db_user:kinjal276@ac-47exnzh-shard-00-00.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-01.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-02.ebbde1m.mongodb.net:27017/intell_meet?ssl=true&authSource=admin&retryWrites=true";

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000
    };

    console.log("Connecting to MongoDB Atlas...");
    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("Connected to MongoDB Atlas successfully");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
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

