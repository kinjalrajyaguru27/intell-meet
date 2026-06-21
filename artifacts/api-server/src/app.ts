import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders } from "./middlewares/security";

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

app.use("/api", router);

import path from "node:path";
import fs from "node:fs";

const frontendDist = path.resolve(import.meta.dirname, "../../meet/dist/public");
const fallbackDist = path.resolve(process.cwd(), "../meet/dist/public");

const staticDir = fs.existsSync(frontendDist) 
  ? frontendDist 
  : (fs.existsSync(fallbackDist) ? fallbackDist : null);

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
