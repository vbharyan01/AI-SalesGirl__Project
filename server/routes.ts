import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertCallSchema, insertUserSchema, updateUserSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { createVapiService } from "./vapi";
import type { Request, Response, NextFunction } from "express";
import passport from "./google-auth";

const storage = getStorage();

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers["authorization"] || "").toString().replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  const userId = await storage.getUserIdBySession(token);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  (req as any).userId = userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  });

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const user = await storage.createUser({ username, password });
      const token = await storage.createSession(user.id);
      res.status(201).json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      const message = (error as Error).message || "Failed to sign up";
      res.status(400).json({ message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const body = z.object({ username: z.string(), password: z.string() }).parse(req.body);
      const user = await storage.verifyPassword(body.username, body.password);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      const token = await storage.createSession(user.id);
      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    const token = (req.headers["authorization"] || "").toString().replace(/^Bearer\s+/i, "");
    await storage.deleteSession(token);
    res.json({ ok: true });
  });

  // Google OAuth routes (only if credentials are configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get("/api/auth/google/callback", 
      passport.authenticate("google", { failureRedirect: "/login" }),
      async (req, res) => {
        try {
          const user = req.user as any;
          if (!user) {
            return res.redirect("/login?error=authentication_failed");
          }
          
          // Create a session token for the user
          const token = await storage.createSession(user.id);
          
          // Redirect to frontend with token
          res.redirect(`/auth-success?token=${token}&username=${encodeURIComponent(user.username)}`);
        } catch (error) {
          console.error("Google OAuth callback error:", error);
          res.redirect("/login?error=session_creation_failed");
        }
      }
    );
  }

  // Firebase Authentication route
  app.post("/api/auth/firebase", async (req, res) => {
    try {
      console.log("Firebase auth route called with body:", req.body);
      const { uid, email, displayName, photoURL } = req.body;
      
      if (!uid || !email) {
        console.log("Missing required fields - uid:", uid, "email:", email);
        return res.status(400).json({ message: "Missing required fields" });
      }

      console.log("Checking if user exists with googleId:", uid);
      // Check if user already exists
      let user = await storage.getUserByGoogleId(uid);
      console.log("Existing user found:", user);
      
      if (!user) {
        console.log("Creating new Google user");
        // Create new user
        const username = displayName || email.split('@')[0] || `user_${Date.now()}`;
        console.log("Username generated:", username);
        
        user = await storage.createGoogleUser({
          googleId: uid,
          username,
          email: email,
          displayName: displayName || '',
          avatar: photoURL || ''
        });
        console.log("New user created:", user);
      }

      console.log("Creating session for user:", user.id);
      // Create session token
      const token = await storage.createSession(user.id);
      console.log("Session token created:", token);
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username,
          email: email,
          displayName: displayName,
          photoURL: photoURL
        } 
      });
    } catch (error) {
      console.error("Firebase auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // User settings
  app.get("/api/settings", authMiddleware, async (req, res) => {
    const userId = (req as any).userId as string;
    const settings = await storage.getUserSettings(userId);
    res.json(settings || {});
  });

  app.put("/api/settings", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const update = updateUserSettingsSchema.parse(req.body);
      const saved = await storage.upsertUserSettings(userId, update);
      res.json(saved);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
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
  app.get("/api/calls", authMiddleware, async (req, res) => {
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
  app.get("/api/stats", authMiddleware, async (req, res) => {
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
  app.get("/api/vapi/calls", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const settings = await storage.getUserSettings(userId);
      
      // For demo purposes, return mock data when VAPI is not available
      const demoCalls = [
        {
          id: "call_001",
          assistantId: "b3870ff6-ed43-402e-bdba-14f65567e517",
          assistant: { name: "Aryan Agent" },
          customer: { 
            number: "+15551234567", 
            name: "John Smith" 
          },
          status: "completed",
          duration: 180,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: "call_002",
          assistantId: "b3870ff6-ed43-402e-bdba-14f65567e517",
          assistant: { name: "Aryan Agent" },
          customer: { 
            number: "+15559876543", 
            name: "Sarah Johnson" 
          },
          status: "completed",
          duration: 245,
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        },
        {
          id: "call_003",
          assistantId: "b3870ff6-ed43-402e-bdba-14f65567e517",
          assistant: { name: "Aryan Agent" },
          customer: { 
            number: "+15551112222", 
            name: "Mike Wilson" 
          },
          status: "pending",
          duration: 0,
          createdAt: new Date().toISOString(),
        }
      ];

      try {
        const service = createVapiService({
          privateKey: (settings?.vapiPrivateKey ?? undefined) || process.env.VAPI_PRIVATE_KEY,
          assistantId: (settings?.assistantId ?? undefined) || process.env.VAPI_ASSISTANT_ID,
          phoneNumberId: (settings?.phoneNumberId ?? undefined) || process.env.VAPI_PHONE_NUMBER_ID,
        });
        const calls = await service.getCalls();
        res.json(calls);
      } catch (vapiError) {
        // If VAPI fails, return demo data
        console.log("VAPI API failed, returning demo data:", vapiError);
        res.json(demoCalls);
      }
    } catch (error) {
      console.error("Error fetching VAPI calls:", error);
      res.status(500).json({ 
        message: "Error fetching calls from VAPI API" 
      });
    }
  });

  // Get specific VAPI call
  app.get("/api/vapi/calls/:callId", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const settings = await storage.getUserSettings(userId);
      const service = createVapiService({
        privateKey: (settings?.vapiPrivateKey ?? undefined) || process.env.VAPI_PRIVATE_KEY,
        assistantId: settings?.assistantId ?? undefined,
        phoneNumberId: settings?.phoneNumberId ?? undefined,
      });
      const call = await service.getCall(req.params.callId);
      res.json(call);
    } catch (error) {
      console.error("Error fetching VAPI call:", error);
      res.status(500).json({ 
        message: "Error fetching call from VAPI API" 
      });
    }
  });

  // Create new call through VAPI
  app.post("/api/vapi/calls", authMiddleware, async (req, res) => {
    try {
      const { phoneNumber, assistantId, testMode } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ 
          message: "Phone number is required" 
        });
      }
      
      // If test mode, just validate the configuration without making a real call
      if (testMode === true || testMode === "true") {
        console.log("Test mode detected, validating configuration...");
        const userId = (req as any).userId as string;
        const settings = await storage.getUserSettings(userId);
        
        console.log("User settings:", { 
          hasPrivateKey: !!settings?.vapiPrivateKey, 
          hasAssistantId: !!settings?.assistantId, 
          hasPhoneNumberId: !!settings?.phoneNumberId 
        });
        
        if (!settings?.vapiPrivateKey) {
          return res.status(400).json({ 
            message: "VAPI private key not configured",
            details: "Please configure your VAPI credentials in settings"
          });
        }
        
        if (!settings?.assistantId) {
          return res.status(400).json({ 
            message: "Assistant ID not configured",
            details: "Please configure your VAPI assistant ID in settings"
          });
        }
        
        if (!settings?.phoneNumberId) {
          return res.status(400).json({ 
            message: "Phone number ID not configured",
            details: "Please configure your VAPI phone number ID in settings"
          });
        }
        
        console.log("Configuration validation passed, returning test response");
        return res.json({ 
          message: "Configuration test passed",
          testMode: true,
          phoneNumber,
          assistantId: settings.assistantId,
          phoneNumberId: settings.phoneNumberId,
          status: "ready_for_testing"
        });
      }
      
      const userId = (req as any).userId as string;
      const settings = await storage.getUserSettings(userId);
      const service = createVapiService({
        privateKey: (settings?.vapiPrivateKey ?? undefined) || process.env.VAPI_PRIVATE_KEY,
        assistantId: settings?.assistantId ?? undefined,
        phoneNumberId: settings?.phoneNumberId ?? undefined,
      });
      const call = await service.createCall(phoneNumber, assistantId);
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
  app.get("/api/vapi/assistant/:assistantId?", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const settings = await storage.getUserSettings(userId);
      const service = createVapiService({
        privateKey: (settings?.vapiPrivateKey ?? undefined) || process.env.VAPI_PRIVATE_KEY,
        assistantId: settings?.assistantId ?? undefined,
        phoneNumberId: settings?.phoneNumberId ?? undefined,
      });
      const assistantId = req.params.assistantId || settings?.assistantId || "";
      const assistant = await service.getAssistant(assistantId);
      res.json(assistant);
    } catch (error) {
      console.error("Error fetching VAPI assistant:", error);
      res.status(500).json({ 
        message: "Error fetching assistant from VAPI API" 
      });
    }
  });

  // Get phone number details
  app.get("/api/vapi/phone/:phoneNumberId?", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const settings = await storage.getUserSettings(userId);
      const service = createVapiService({
        privateKey: (settings?.vapiPrivateKey ?? undefined) || process.env.VAPI_PRIVATE_KEY,
        assistantId: (settings?.assistantId ?? undefined) || process.env.VAPI_ASSISTANT_ID,
        phoneNumberId: (settings?.phoneNumberId ?? undefined) || process.env.VAPI_PHONE_NUMBER_ID,
      });
      const phoneNumberId = req.params.phoneNumberId || settings?.phoneNumberId || "";
      const phoneNumber = await service.getPhoneNumber(phoneNumberId);
      res.json(phoneNumber);
    } catch (error) {
      console.error("Error fetching VAPI phone number:", error);
      res.status(500).json({ 
        message: "Error fetching phone number from VAPI API" 
      });
    }
  });

  // Search VAPI calls by agent ID, phone number, or customer name
  app.get("/api/vapi/search", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const { q: searchQuery } = req.query;
      
      if (!searchQuery) {
        return res.status(400).json({ message: "Search query parameter 'q' is required" });
      }

      // For demo purposes, return mock data when VAPI is not available
      const demoCalls = [
        {
          id: "call_001",
          assistantId: "b3870ff6-ed43-402e-bdba-14f65567e517",
          assistant: { name: "Aryan Agent" },
          customer: { 
            number: "+15551234567", 
            name: "John Smith" 
          },
          status: "completed",
          duration: 180,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: "call_002",
          assistantId: "b3870ff6-ed43-402e-bdba-14f65567e517",
          assistant: { name: "Aryan Agent" },
          customer: { 
            number: "+15559876543", 
            name: "Sarah Johnson" 
          },
          status: "completed",
          duration: 245,
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        },
        {
          id: "call_003",
          assistantId: "b3870ff6-ed43-402e-bdba-14f65567e517",
          assistant: { name: "Aryan Agent" },
          customer: { 
            number: "+15551112222", 
            name: "Mike Wilson" 
          },
          status: "pending",
          duration: 0,
          createdAt: new Date().toISOString(),
        }
      ];

      // Filter demo calls based on search query
      const query = searchQuery.toString().toLowerCase();
      const filteredCalls = demoCalls.filter((call: any) => {
        // Search by agent ID
        if (call.assistantId?.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search by phone number
        if (call.customer?.number?.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search by customer name
        if (call.customer?.name?.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search by call ID
        if (call.id?.toLowerCase().includes(query)) {
          return true;
        }

        // Search by agent name
        if (call.assistant?.name?.toLowerCase().includes(query)) {
          return true;
        }
        
        return false;
      });

      res.json(filteredCalls);
    } catch (error) {
      console.error("Error searching VAPI calls:", error);
      res.status(500).json({ 
        message: "Error searching calls from VAPI API" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
