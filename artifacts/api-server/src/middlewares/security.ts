import { type Request, type Response, type NextFunction } from "express";

/**
 * Custom security headers middleware (substitute for Helmet/XSS protection).
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent mime-based attacks
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent frame integration (clickjacking protection)
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Enable XSS filters in modern browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Control referrer leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Strict Transport Security (HSTS)
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Content Security Policy (basic configuration)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' wss: ws: https:; media-src 'self' blob:; frame-src 'self';"
  );

  next();
}
