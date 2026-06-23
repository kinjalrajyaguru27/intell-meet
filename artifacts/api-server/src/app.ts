import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders } from "./middlewares/security";
import { initSignaling } from "./signaling";

import { connectDB } from "@workspace/db";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(securityHeaders);
app.use(cookieParser());
const corsOrigin = process.env.CORS_ORIGIN 
  ? (process.env.CORS_ORIGIN.includes(",") ? process.env.CORS_ORIGIN.split(",") : process.env.CORS_ORIGIN)
  : true;

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware to ensure DB connection is active on Vercel / serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    logger.error({ err }, "Database connection error in request middleware");
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Lazy-initialize Socket.IO server on-demand for Vercel Serverless Function context
app.all("/api/socket.io", (req, res, next) => {
  const server = (res.socket as any)?.server;
  if (server && !server.io) {
    logger.info("Initializing Socket.io server on-demand on Vercel HTTP server instance");
    initSignaling(server);
    (server as any).io = true; // Mark it so we don't initialize again on this server instance
  }
  next();
});

app.use("/api", router);

import path from "node:path";
import fs from "node:fs";

const getStaticDir = () => {
  const possiblePaths = [
    path.resolve(process.cwd(), "artifacts/meet/dist/public"),
    path.resolve(process.cwd(), "../meet/dist/public"),
    path.resolve(process.cwd(), "meet/dist/public")
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
};

const staticDir = getStaticDir();

if (staticDir) {
  logger.info({ staticDir }, "Serving frontend static assets from path");
  app.use(express.static(staticDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  logger.warn("Frontend static build directory not found. API server running in standalone mode.");
}

export default app;
