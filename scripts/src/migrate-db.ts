import mongoose from "mongoose";

const LOCAL_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intell_meet";
const ATLAS_URI = process.env.ATLAS_URI || "mongodb://rajyagurukinjal27_db_user:kinjal276@ac-47exnzh-shard-00-00.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-01.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-02.ebbde1m.mongodb.net:27017/intell_meet?ssl=true&authSource=admin&retryWrites=true";

async function runMigration() {
  console.log("==========================================================");
  console.log("INTELL MEET - MONGODB PRODUCTION MIGRATION TOOL");
  console.log("==========================================================\n");

  console.log(`Source (Localhost): ${LOCAL_URI}`);
  console.log(`Target (Atlas):     ${ATLAS_URI}\n`);

  console.log("----------------------------------------------------------");
  console.log("1. GENERATING STANDALONE CLI MIGRATION COMMANDS");
  console.log("----------------------------------------------------------");
  console.log("To migrate using standard MongoDB database tools, run these commands:");
  console.log(`\n  # Step A: Dump the localhost database to a temporary folder`);
  console.log(`  mongodump --uri="${LOCAL_URI}" --out=./db-dump`);
  console.log(`\n  # Step B: Restore the dumped database to MongoDB Atlas`);
  console.log(`  mongorestore --uri="${ATLAS_URI}" ./db-dump/intell_meet\n`);

  console.log("----------------------------------------------------------");
  console.log("2. ATTEMPTING DIRECT RUNTIME MIGRATION VIA NODE.JS");
  console.log("----------------------------------------------------------");

  let localConn: mongoose.Connection | null = null;
  let atlasConn: mongoose.Connection | null = null;

  try {
    console.log("Connecting to Source Localhost MongoDB...");
    localConn = mongoose.createConnection(LOCAL_URI);
    await localConn.asPromise();
    console.log("✓ Connected to Localhost successfully.");
  } catch (err: any) {
    console.error("✗ Failed to connect to local MongoDB. Make sure mongod is running locally.", err.message);
    process.exit(1);
  }

  try {
    console.log("Connecting to Target MongoDB Atlas Cluster...");
    atlasConn = mongoose.createConnection(ATLAS_URI);
    // Timeout quickly (10s) if the IP is not whitelisted
    await Promise.race([
      atlasConn.asPromise(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout - IP likely not whitelisted")), 10000))
    ]);
    console.log("✓ Connected to MongoDB Atlas successfully.");
  } catch (err: any) {
    console.warn("\n⚠️  COULD NOT ESTABLISH CONNECTION TO MONGO ATLAS:");
    console.warn(`   Reason: ${err.message}`);
    console.warn("   This is expected if your sandbox/local IP is not whitelisted on Atlas.");
    console.warn("   To resolve, add '0.0.0.0/0' (allow access from anywhere) in Atlas Network Access settings");
    console.warn("   or run this migration script locally from your whitelisted development environment.\n");
    
    console.log("Closing local connection...");
    if (localConn) await localConn.close();
    console.log("Migration script terminated gracefully.");
    return;
  }

  try {
    const localDb = localConn.db;
    const atlasDb = atlasConn.db;

    if (!localDb || !atlasDb) {
      throw new Error("Could not retrieve DB objects from connections.");
    }

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in local database.\n`);

    console.log("Migrating collections...");
    
    const migrationResults: Array<{
      collection: string;
      localCount: number;
      atlasCount: number;
      status: string;
    }> = [];

    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName.startsWith("system.")) {
        console.log(`- Skipping system collection: ${collName}`);
        continue;
      }

      console.log(`Migrating "${collName}"...`);
      const localColl = localDb.collection(collName);
      const atlasColl = atlasDb.collection(collName);

      // Clean target collection first to prevent duplicate key errors
      await atlasColl.deleteMany({});

      const docCount = await localColl.countDocuments();
      if (docCount > 0) {
        // Read documents from local
        const docs = await localColl.find({}).toArray();
        // Insert into Atlas
        await atlasColl.insertMany(docs);
        console.log(`  -> Copied ${docCount} documents.`);
      } else {
        console.log(`  -> Collection is empty.`);
      }

      // Recreate Indexes
      const indexes = await localColl.indexes();
      for (const idx of indexes) {
        // Skip default _id index creation
        if (idx.name === "_id_") continue;
        
        console.log(`  -> Creating index: ${JSON.stringify(idx.key)}`);
        // Remove ns and v if present to prevent driver errors
        const { ns, v, ...idxOptions } = idx as any;
        await atlasColl.createIndex(idx.key, idxOptions);
      }

      const atlasDocCount = await atlasColl.countDocuments();
      migrationResults.push({
        collection: collName,
        localCount: docCount,
        atlasCount: atlasDocCount,
        status: docCount === atlasDocCount ? "✓ Match" : "✗ Mismatch"
      });
    }

    console.log("\n==========================================================");
    console.log("MIGRATION COMPLETE - SUMMARY REPORT");
    console.log("==========================================================");
    console.table(migrationResults);

  } catch (err: any) {
    console.error("Migration failed due to runtime error:", err);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
    console.log("Connections closed.");
  }
}

runMigration().catch(console.error);
