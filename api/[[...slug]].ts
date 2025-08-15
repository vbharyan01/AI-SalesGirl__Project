import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";

// MongoDB connection and models
let isConnected = false;

async function connectMongo(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) return mongoose;
  const mongoUrl = process.env.MONGODB_URI || "";
  if (!mongoUrl) {
    throw new Error("MONGODB_URI must be set");
  }
  await mongoose.connect(mongoUrl, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });
  isConnected = true;
  return mongoose;
}

// Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

const UserSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  vapiPrivateKey: { type: String },
  assistantId: { type: String },
  phoneNumberId: { type: String },
  defaultCustomerNumber: { type: String },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

const SessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

const CallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  email: { type: String },
  phone: { type: String },
  status: { type: String, required: true },
  notes: { type: String },
  recording_url: { type: String },
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
}, { versionKey: false });

// Models
const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const UserSettingsModel = mongoose.models.UserSettings || mongoose.model("UserSettings", UserSettingsSchema);
const SessionModel = mongoose.models.Session || mongoose.model("Session", SessionSchema);
const CallModel = mongoose.models.Call || mongoose.model("Call", CallSchema);

// Auth middleware
async function authMiddleware(req: any, res: any, next: any) {
  try {
    const token = (req.headers["authorization"] || "").toString().replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    await connectMongo();
    const session = await SessionModel.findOne({ token, expiresAt: { $gt: new Date() } }).lean();
    if (!session) return res.status(401).json({ message: "Unauthorized" });
    
    (req as any).userId = String(session.userId);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Auth error" });
  }
}

// VAPI service
class VapiService {
  private readonly privateKey: string;
  private readonly defaultAssistantId?: string;
  private readonly defaultPhoneNumberId?: string;

  constructor(options?: { privateKey?: string; assistantId?: string; phoneNumberId?: string }) {
    this.privateKey = options?.privateKey || process.env.VAPI_PRIVATE_KEY || "";
    this.defaultAssistantId = options?.assistantId;
    this.defaultPhoneNumberId = options?.phoneNumberId;
  }

  private async vapiRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.privateKey) {
      throw new Error("VAPI private key missing. Please configure in settings.");
    }
    const response = await fetch(`https://api.vapi.ai${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.privateKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VAPI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getCalls() {
    return await this.vapiRequest("/call");
  }

  async getCall(callId: string) {
    return await this.vapiRequest(`/call/${callId}`);
  }

  async createCall(phoneNumber: string, assistantId?: string) {
    const formattedPhone = this.formatToE164(phoneNumber);
    
    return await this.vapiRequest("/call", {
      method: "POST",
      body: JSON.stringify({
        phoneNumberId: this.defaultPhoneNumberId,
        assistantId: assistantId || this.defaultAssistantId,
        customer: { number: formattedPhone },
      }),
    });
  }

  async getAssistant(assistantId: string) {
    return await this.vapiRequest(`/assistant/${assistantId}`);
  }

  async getPhoneNumber(phoneNumberId: string) {
    return await this.vapiRequest(`/phone-number/${phoneNumberId}`);
  }

  private formatToE164(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length > 10) return `+${digits}`;
    return `+1${digits}`;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Serverless function called for:", req.url);
    console.log("Environment check:", {
      USE_MONGO: process.env.USE_MONGO,
      MONGODB_URI: process.env.MONGODB_URI ? "SET" : "NOT SET",
      MONGO_DB_NAME: process.env.MONGO_DB_NAME
    });

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Auth routes
    app.post("/api/auth/signup", async (req, res) => {
      try {
        await connectMongo();
        const { username, password } = z.object({ username: z.string(), password: z.string() }).parse(req.body);
        
        const existing = await UserModel.findOne({ username }).lean();
        if (existing) return res.status(400).json({ message: "Username already exists" });
        
        const passwordHash = await bcrypt.hash(password, 12);
        const created = await UserModel.create({ username, passwordHash });
        
        const token = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
        await SessionModel.create({ token, userId: created._id, expiresAt });
        
        res.status(201).json({ 
          token, 
          user: { id: String(created._id), username: created.username } 
        });
      } catch (error) {
        console.error("Signup error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        res.status(400).json({ message: error instanceof Error ? error.message : "Failed to sign up" });
      }
    });

    app.post("/api/auth/login", async (req, res) => {
      try {
        await connectMongo();
        const { username, password } = z.object({ username: z.string(), password: z.string() }).parse(req.body);
        
        const user = await UserModel.findOne({ username });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });
        
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: "Invalid credentials" });
        
        const token = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
        await SessionModel.create({ token, userId: user._id, expiresAt });
        
        res.json({ 
          token, 
          user: { id: String(user._id), username: user.username } 
        });
      } catch (error) {
        console.error("Login error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to login" });
      }
    });

    app.post("/api/auth/logout", authMiddleware, async (req, res) => {
      try {
        const token = (req.headers["authorization"] || "").toString().replace(/^Bearer\s+/i, "");
        await SessionModel.deleteOne({ token });
        res.json({ ok: true });
      } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Logout failed" });
      }
    });

    // User settings
    app.get("/api/settings", authMiddleware, async (req, res) => {
      try {
        const userId = (req as any).userId;
        const settings = await UserSettingsModel.findOne({ userId }).lean();
        res.json(settings || {});
      } catch (error) {
        console.error("Get settings error:", error);
        res.status(500).json({ message: "Failed to get settings" });
      }
    });

    app.put("/api/settings", authMiddleware, async (req, res) => {
      try {
        const userId = (req as any).userId;
        const update = z.object({
          vapiPrivateKey: z.string().optional(),
          assistantId: z.string().optional(),
          phoneNumberId: z.string().optional(),
          defaultCustomerNumber: z.string().optional(),
        }).parse(req.body);
        
        const saved = await UserSettingsModel.findOneAndUpdate(
          { userId },
          { $set: { ...update, updatedAt: new Date() } },
          { new: true, upsert: true }
        ).lean();
        
        res.json(saved);
      } catch (error) {
        console.error("Update settings error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update settings" });
      }
    });

    // Call management
    app.get("/api/calls", authMiddleware, async (req, res) => {
      try {
        await connectMongo();
        const calls = await CallModel.find().sort({ timestamp: -1 }).lean();
        res.json(calls.map(c => ({
          id: String(c._id),
          name: c.name,
          company: c.company || null,
          email: c.email || null,
          phone: c.phone || null,
          status: c.status,
          notes: c.notes || null,
          recording_url: c.recording_url || null,
          timestamp: c.timestamp,
        })));
      } catch (error) {
        console.error("Get calls error:", error);
        res.status(500).json({ message: "Failed to get calls" });
      }
    });

    app.get("/api/stats", authMiddleware, async (req, res) => {
      try {
        await connectMongo();
        const [totalCalls, completedCalls, pendingCalls, failedCalls] = await Promise.all([
          CallModel.countDocuments({}),
          CallModel.countDocuments({ status: "completed" }),
          CallModel.countDocuments({ status: "pending" }),
          CallModel.countDocuments({ status: "failed" }),
        ]);
        const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
        res.json({ totalCalls, completedCalls, pendingCalls, failedCalls, successRate });
      } catch (error) {
        console.error("Get stats error:", error);
        res.status(500).json({ message: "Failed to get stats" });
      }
    });

    // VAPI endpoints
    app.get("/api/vapi/calls", authMiddleware, async (req, res) => {
      try {
        const userId = (req as any).userId;
        const settings = await UserSettingsModel.findOne({ userId }).lean();
        const service = new VapiService({
          privateKey: settings?.vapiPrivateKey || process.env.VAPI_PRIVATE_KEY,
          assistantId: settings?.assistantId,
          phoneNumberId: settings?.phoneNumberId,
        });
        const calls = await service.getCalls();
        res.json(calls);
      } catch (error) {
        console.error("VAPI calls error:", error);
        res.status(500).json({ message: "Failed to get VAPI calls" });
      }
    });

    app.post("/api/vapi/calls", authMiddleware, async (req, res) => {
      try {
        const { phoneNumber, assistantId } = req.body;
        if (!phoneNumber) return res.status(400).json({ message: "Phone number is required" });
        
        const userId = (req as any).userId;
        const settings = await UserSettingsModel.findOne({ userId }).lean();
        const service = new VapiService({
          privateKey: settings?.vapiPrivateKey || process.env.VAPI_PRIVATE_KEY,
          assistantId: settings?.assistantId,
          phoneNumberId: settings?.phoneNumberId,
        });
        
        const call = await service.createCall(phoneNumber, assistantId);
        res.json(call);
      } catch (error) {
        console.error("Create VAPI call error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ 
          message: "Failed to create call",
          details: errorMessage
        });
      }
    });

    app.get("/api/vapi/assistant/:assistantId?", authMiddleware, async (req, res) => {
      try {
        const userId = (req as any).userId;
        const settings = await UserSettingsModel.findOne({ userId }).lean();
        const service = new VapiService({
          privateKey: settings?.vapiPrivateKey || process.env.VAPI_PRIVATE_KEY,
          assistantId: settings?.assistantId,
          phoneNumberId: settings?.phoneNumberId,
        });
        
        const assistantId = req.params.assistantId || settings?.assistantId || "";
        const assistant = await service.getAssistant(assistantId);
        res.json(assistant);
      } catch (error) {
        console.error("VAPI assistant error:", error);
        res.status(500).json({ message: "Failed to get assistant" });
      }
    });

    app.get("/api/vapi/phone/:phoneNumberId?", authMiddleware, async (req, res) => {
      try {
        const userId = (req as any).userId;
        const settings = await UserSettingsModel.findOne({ userId }).lean();
        const service = new VapiService({
          privateKey: settings?.vapiPrivateKey || process.env.VAPI_PRIVATE_KEY,
          assistantId: settings?.assistantId,
          phoneNumberId: settings?.phoneNumberId,
        });
        
        const phoneNumberId = req.params.phoneNumberId || settings?.phoneNumberId || "";
        const phoneNumber = await service.getPhoneNumber(phoneNumberId);
        res.json(phoneNumber);
      } catch (error) {
        console.error("VAPI phone error:", error);
        res.status(500).json({ message: "Failed to get phone number" });
      }
    });

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


