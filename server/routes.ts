import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCallSchema } from "@shared/schema";
import { z } from "zod";
import { vapiService } from "./vapi";

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

  // VAPI SDK endpoints
  
  // Get VAPI calls directly from their API
  app.get("/api/vapi/calls", async (req, res) => {
    try {
      const calls = await vapiService.getCalls();
      res.json(calls);
    } catch (error) {
      console.error("Error fetching VAPI calls:", error);
      res.status(500).json({ 
        message: "Error fetching calls from VAPI API" 
      });
    }
  });

  // Get specific VAPI call
  app.get("/api/vapi/calls/:callId", async (req, res) => {
    try {
      const call = await vapiService.getCall(req.params.callId);
      res.json(call);
    } catch (error) {
      console.error("Error fetching VAPI call:", error);
      res.status(500).json({ 
        message: "Error fetching call from VAPI API" 
      });
    }
  });

  // Create new call through VAPI
  app.post("/api/vapi/calls", async (req, res) => {
    try {
      const { phoneNumber, assistantId } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ 
          message: "Phone number is required" 
        });
      }
      
      const call = await vapiService.createCall(phoneNumber, assistantId);
      res.json(call);
    } catch (error) {
      console.error("Error creating VAPI call:", error);
      
      // Check for specific VAPI errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("Can't Dial Outbound Yet")) {
        return res.status(400).json({ 
          message: "Outbound calling not enabled", 
          details: "Your VAPI account needs outbound calling enabled. Contact VAPI support to enable this feature." 
        });
      }
      
      if (errorMessage.includes("valid phone number in the E.164 format")) {
        return res.status(400).json({ 
          message: "Invalid phone number format", 
          details: "Please enter a valid phone number with country code (e.g., +15551234567)" 
        });
      }
      
      res.status(500).json({ 
        message: "Error creating call through VAPI API",
        details: errorMessage.includes("VAPI API error") ? errorMessage : "Please check your VAPI configuration"
      });
    }
  });

  // Get assistant details
  app.get("/api/vapi/assistant/:assistantId?", async (req, res) => {
    try {
      const assistantId = req.params.assistantId;
      const assistant = await vapiService.getAssistant(assistantId);
      res.json(assistant);
    } catch (error) {
      console.error("Error fetching VAPI assistant:", error);
      res.status(500).json({ 
        message: "Error fetching assistant from VAPI API" 
      });
    }
  });

  // Get phone number details
  app.get("/api/vapi/phone/:phoneNumberId?", async (req, res) => {
    try {
      const phoneNumberId = req.params.phoneNumberId;
      const phoneNumber = await vapiService.getPhoneNumber(phoneNumberId);
      res.json(phoneNumber);
    } catch (error) {
      console.error("Error fetching VAPI phone number:", error);
      res.status(500).json({ 
        message: "Error fetching phone number from VAPI API" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
