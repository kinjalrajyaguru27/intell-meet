import { connectDB } from "../lib/db/src";
import * as models from "../lib/db/src";

async function main() {
  // Ensure we set MONGODB_URI
  process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intell_meet";
  console.log("Connecting to:", process.env.MONGODB_URI);
  await connectDB();

  const modelNames = [
    "User",
    "Meeting",
    "Task",
    "Team",
    "Invitation",
    "Participant",
    "Recording",
    "MeetingChat",
    "MeetingNotification",
    "MeetingTranscript",
    "MeetingSummary",
    "ActionItem",
    "MeetingInsight",
    "Decision"
  ];

  for (const name of modelNames) {
    const model = (models as any)[name];
    if (!model) {
      console.warn(`Model ${name} not found in exported models`);
      continue;
    }
    
    try {
      const count = await model.countDocuments();
      console.log(`\n=============================================`);
      console.log(`Collection: ${model.collection.name} (${name})`);
      console.log(`Count: ${count}`);
      if (count > 0) {
        const samples = await model.find().limit(3).lean();
        console.log("Samples:");
        console.log(JSON.stringify(samples, null, 2));
      } else {
        console.log("No records found.");
      }
    } catch (err) {
      console.error(`Error querying ${name}:`, err);
    }
  }

  await models.mongoose.connection.close();
  console.log("\nFinished database audit.");
}

main().catch(console.error);
