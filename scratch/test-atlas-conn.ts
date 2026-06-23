import { mongoose } from "../lib/db/src";

const ATLAS_URI = "mongodb+srv://rajyagurukinjal27_db_user:kinjal276@intell-meet-cluster.ebbde1m.mongodb.net/intell_meet?retryWrites=true&w=majority";

async function main() {
  console.log("Connecting to Atlas MongoDB...");
  try {
    await mongoose.connect(ATLAS_URI);
    console.log("Successfully connected to MongoDB Atlas!");
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log("Collections:", collections?.map(c => c.name));
    await mongoose.connection.close();
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas:", err);
  }
}

main();
