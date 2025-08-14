import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCallSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // VAPI webhook endpoint - protected with API key
  app.post("/api/logCall", async (req, res) => {
    try {
      // Check API key
      const apiKey = req.headers["x-api-key"];
      const expectedApiKey = process.env.API_KEY || process.env.VAPI_API_KEY;
      
      if (!expectedApiKey) {
        return res.status(500).json({ 
          message: "Server configuration error: API key not configured" 
        });
      }
      
      if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({ 
          message: "Unauthorized: Invalid or missing API key" 
        });
      }

      // Validate request body
      const callData = insertCallSchema.parse(req.body);
      
      // Store call in database
      const call = await storage.createCall(callData);
      
      res.status(201).json({ 
        message: "Call logged successfully", 
        callId: call.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      console.error("Error logging call:", error);
      res.status(500).json({ 
        message: "Internal server error while logging call" 
      });
    }
  });

  // Get all calls endpoint
  app.get("/api/calls", async (req, res) => {
    try {
      const calls = await storage.getCalls();
      res.json(calls);
    } catch (error) {
      console.error("Error fetching calls:", error);
      res.status(500).json({ 
        message: "Internal server error while fetching calls" 
      });
    }
  });

  // Get call statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getCallStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ 
        message: "Internal server error while fetching statistics" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
