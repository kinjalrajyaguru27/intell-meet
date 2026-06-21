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

// Connect to MongoDB and then start listening
connectDB()
  .then(() => {
    httpServer.listen(port, () => {
      logger.info({ port }, "Server listening and connected to MongoDB");
      console.log(`\n🚀 Intell Meet is ready! Open http://localhost:${port} in your browser to view the application.\n`);
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to database. Server not started.");
    process.exit(1);
  });

httpServer.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
