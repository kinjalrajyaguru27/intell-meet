import { connectDB } from "../lib/db/src";
import { Meeting } from "../lib/db/src";

async function main() {
  process.env.MONGODB_URI = "mongodb://localhost:27017/intell_meet";
  await connectDB();
  
  const meetings = await Meeting.find().lean();
  console.log(`Found ${meetings.length} meetings:`);
  meetings.forEach((m: any) => {
    console.log({
      _id: m._id,
      id: m.id,
      roomId: m.roomId,
      meetingId: m.meetingId,
      name: m.name,
      title: m.title,
    });
  });
  
  process.exit(0);
}

main().catch(console.error);
