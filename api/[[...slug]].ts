import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Serverless function called for:", req.url);
    console.log("Environment check:", {
      USE_MONGO: process.env.USE_MONGO,
      MONGODB_URI: process.env.MONGODB_URI ? "SET" : "NOT SET",
      MONGO_DB_NAME: process.env.MONGO_DB_NAME
    });
    
    // Create a new Express app for each request to avoid state issues
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register routes
    await registerRoutes(app);
    
    // Handle the request
    app(req as any, res as any);
  } catch (error) {
    console.error("Serverless function error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    res.status(500).json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Unknown error",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}


