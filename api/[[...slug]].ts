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
    await registerRoutes(app);
    initialized = true;
  }
  return app(req as any, res as any);
}


