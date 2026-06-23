// Export the Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  try {
    // Dynamically import the Express app to catch any import-time or initialization errors
    const module = await import("../artifacts/api-server/src/app");
    const app = module.default;
    
    // Pass the request to the Express application
    app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Function Initialization Error:", err);
    res.status(500).json({
      error: "Vercel Serverless Function Initialization Error",
      message: err.message,
      stack: err.stack,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        HAS_MONGODB_URI: !!process.env.MONGODB_URI,
      }
    });
  }
}
