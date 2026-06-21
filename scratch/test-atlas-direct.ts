import { mongoose } from "../lib/db/src";

// Shard hostnames resolved from SRV lookup
const directUri = "mongodb://rajyagurukinjal27_db_user:db_user@ac-47exnzh-shard-00-00.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-01.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-02.ebbde1m.mongodb.net:27017/intell_meet?ssl=true&authSource=admin&retryWrites=true";

async function main() {
  console.log("Connecting directly to Atlas shards...");
  try {
    await mongoose.connect(directUri);
    console.log("Successfully connected to MongoDB Atlas directly!");
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log("Collections:", collections?.map(c => c.name));
    await mongoose.connection.close();
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas directly:", err);
  }
}

main();
