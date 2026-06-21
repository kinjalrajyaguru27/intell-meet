import { type Request, type Response, type NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const limitsStore = new Map<string, RateLimitRecord>();

/**
 * Basic memory-backed rate limiter middleware.
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum number of requests allowed per window
 */
export function rateLimiter(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true" || process.env.NODE_ENV !== "production") {
      next();
      return;
    }

    // Treat proxy IP or socket IP as client address
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    let record = limitsStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      limitsStore.set(key, record);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));
      res.status(429).json({
        error: "Too many requests from this IP. Please try again later.",
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    record.count++;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - record.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
    next();
  };
}
