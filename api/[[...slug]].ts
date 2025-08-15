import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

// Create a single Express app and reuse between invocations
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
let initialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!initialized) {
    try {
      await registerRoutes(app);
      initialized = true;
    } catch (error) {
      console.error("Failed to initialize routes:", error);
      return res.status(500).json({ error: "Failed to initialize server" });
    }
  }
  
  // Convert Vercel request/response to Express format
  const expressReq = req as any;
  const expressRes = res as any;
  
  // Handle the request through Express
  app(expressReq, expressRes);
}


