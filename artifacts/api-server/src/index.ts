import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const getDirname = () => {
  try {
    if (typeof __dirname !== "undefined") {
      return __dirname;
    }
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return process.cwd();
  }
};

// Load environment variables from .env file if it exists (checks multiple fallback locations)
try {
  const currentDir = getDirname();
  const envPath1 = path.resolve(currentDir, "../.env");
  const envPath2 = path.resolve(process.cwd(), ".env");
  const envPath3 = path.resolve(process.cwd(), "artifacts/api-server/.env");
  
  let loaded = false;
  for (const envPath of [envPath1, envPath2, envPath3]) {
    if (fs.existsSync(envPath)) {
      if (typeof (process as any).loadEnvFile === "function") {
        (process as any).loadEnvFile(envPath);
        loaded = true;
        break;
      }
    }
  }
} catch (e) {
  console.warn("Failed to load .env file programmatically:", e);
}

import { createServer } from "http";
import app from "./app";
import { initSignaling } from "./signaling";
import { logger } from "./lib/logger";
import { connectDB } from "@workspace/db";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

initSignaling(httpServer);

// Start listening immediately
httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
  console.log(`\n🚀 Intell Meet is ready! Open http://localhost:${port} in your browser to view the application.\n`);
});

// Connect to MongoDB asynchronously in the background
connectDB()
  .then(() => {
    logger.info("Connected to MongoDB successfully");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to database. Server is running offline/without MongoDB.");
  });

httpServer.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
