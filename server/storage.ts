import {
  calls,
  userSettings,
  type Call,
  type InsertCall,
  type User,
  type InsertUser,
  type UserSettings,
  type InsertUserSettings,
  type UpdateUserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count } from "drizzle-orm";
import { connectMongo, UserModel, UserSettingsModel, SessionModel, CallModel } from "./mongo";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(username: string, password: string): Promise<User | undefined>;
  createSession(userId: string): Promise<string>;
  getUserIdBySession(token: string): Promise<string | undefined>;
  deleteSession(token: string): Promise<void>;
  getUserSettings(userId: string): Promise<UserSettings | null>;
  upsertUserSettings(userId: string, update: UpdateUserSettings): Promise<UserSettings>;
  createCall(call: InsertCall): Promise<Call>;
  getCalls(): Promise<Call[]>;
  getCallStats(): Promise<{
    totalCalls: number;
    completedCalls: number;
    pendingCalls: number;
    failedCalls: number;
    successRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    // Not implemented in Postgres path
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("User creation not implemented");
  }

  async verifyPassword(_username: string, _password: string): Promise<User | undefined> {
    return undefined;
  }

  async createSession(_userId: string): Promise<string> {
    throw new Error("Sessions not implemented for Postgres path");
  }

  async getUserIdBySession(_token: string): Promise<string | undefined> {
    return undefined;
  }

  async deleteSession(_token: string): Promise<void> {
    return;
  }

  async getUserSettings(_userId: string): Promise<UserSettings | null> {
    return null;
  }

  async upsertUserSettings(_userId: string, _update: UpdateUserSettings): Promise<UserSettings> {
    throw new Error("Not implemented");
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const [call] = await db
      .insert(calls)
      .values(insertCall)
      .returning();
    return call;
  }

  async getCalls(): Promise<Call[]> {
    return await db
      .select()
      .from(calls)
      .orderBy(desc(calls.timestamp));
  }

  async getCallStats(): Promise<{
    totalCalls: number;
    completedCalls: number;
    pendingCalls: number;
    failedCalls: number;
    successRate: number;
  }> {
    const totalResult = await db
      .select({ count: count() })
      .from(calls);
    
    const completedResult = await db
      .select({ count: count() })
      .from(calls)
      .where(eq(calls.status, "completed"));
    
    const pendingResult = await db
      .select({ count: count() })
      .from(calls)
      .where(eq(calls.status, "pending"));
    
    const failedResult = await db
      .select({ count: count() })
      .from(calls)
      .where(eq(calls.status, "failed"));

    const totalCalls = totalResult[0]?.count || 0;
    const completedCalls = completedResult[0]?.count || 0;
    const pendingCalls = pendingResult[0]?.count || 0;
    const failedCalls = failedResult[0]?.count || 0;
    
    const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

    return {
      totalCalls,
      completedCalls,
      pendingCalls,
      failedCalls,
      successRate,
    };
  }
}

export const storage = new DatabaseStorage();

export class MongoStorage implements IStorage {
  private async ensure(): Promise<void> {
    await connectMongo();
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensure();
    const user = await UserModel.findById(id).lean();
    if (!user) return undefined;
    return { id: String(user._id), username: user.username, password: user.passwordHash };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensure();
    const user = await UserModel.findOne({ username }).lean();
    if (!user) return undefined;
    return { id: String(user._id), username: user.username, password: user.passwordHash };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensure();
    const existing = await UserModel.findOne({ username: insertUser.username }).lean();
    if (existing) throw new Error("Username already exists");
    const passwordHash = await bcrypt.hash(insertUser.password, 12);
    const created = await UserModel.create({ username: insertUser.username, passwordHash });
    return { id: String(created._id), username: created.username, password: created.passwordHash };
  }

  async verifyPassword(username: string, password: string): Promise<User | undefined> {
    await this.ensure();
    const user = await UserModel.findOne({ username });
    if (!user) return undefined;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return undefined;
    return { id: String(user._id), username: user.username, password: user.passwordHash };
  }

  async createSession(userId: string): Promise<string> {
    await this.ensure();
    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await SessionModel.create({ token, userId, expiresAt });
    return token;
  }

  async getUserIdBySession(token: string): Promise<string | undefined> {
    await this.ensure();
    const session = await SessionModel.findOne({ token, expiresAt: { $gt: new Date() } }).lean();
    if (!session) return undefined;
    return String(session.userId);
  }

  async deleteSession(token: string): Promise<void> {
    await this.ensure();
    await SessionModel.deleteOne({ token });
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    await this.ensure();
    const settings = await UserSettingsModel.findOne({ userId }).lean();
    if (!settings) return null;
    return {
      id: String(settings._id),
      userId: String(settings.userId),
      vapiPrivateKey: settings.vapiPrivateKey || null,
      assistantId: settings.assistantId || null,
      phoneNumberId: settings.phoneNumberId || null,
      defaultCustomerNumber: settings.defaultCustomerNumber || null,
      updatedAt: settings.updatedAt || new Date(),
    } as unknown as UserSettings;
  }

  async upsertUserSettings(userId: string, update: UpdateUserSettings): Promise<UserSettings> {
    await this.ensure();
    const doc = await UserSettingsModel.findOneAndUpdate(
      { userId },
      { $set: { ...update, updatedAt: new Date() } },
      { new: true, upsert: true }
    ).lean();
    return {
      id: String(doc!._id),
      userId: String(doc!.userId),
      vapiPrivateKey: doc!.vapiPrivateKey || null,
      assistantId: doc!.assistantId || null,
      phoneNumberId: doc!.phoneNumberId || null,
      defaultCustomerNumber: doc!.defaultCustomerNumber || null,
      updatedAt: doc!.updatedAt || new Date(),
    } as unknown as UserSettings;
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    await this.ensure();
    const created = await CallModel.create({ ...insertCall });
    return {
      id: String(created._id),
      name: created.name,
      company: created.company || null,
      email: created.email || null,
      phone: created.phone || null,
      status: created.status,
      notes: created.notes || null,
      recording_url: created.recording_url || null,
      timestamp: created.timestamp,
    } as unknown as Call;
  }

  async getCalls(): Promise<Call[]> {
    await this.ensure();
    const items = await CallModel.find().sort({ timestamp: -1 }).lean();
    return items.map((c) => ({
      id: String(c._id),
      name: c.name,
      company: c.company || null,
      email: c.email || null,
      phone: c.phone || null,
      status: c.status,
      notes: c.notes || null,
      recording_url: c.recording_url || null,
      timestamp: c.timestamp,
    })) as unknown as Call[];
  }

  async getCallStats(): Promise<{
    totalCalls: number;
    completedCalls: number;
    pendingCalls: number;
    failedCalls: number;
    successRate: number;
  }> {
    await this.ensure();
    const [totalCalls, completedCalls, pendingCalls, failedCalls] = await Promise.all([
      CallModel.countDocuments({}),
      CallModel.countDocuments({ status: "completed" }),
      CallModel.countDocuments({ status: "pending" }),
      CallModel.countDocuments({ status: "failed" }),
    ]);
    const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
    return { totalCalls, completedCalls, pendingCalls, failedCalls, successRate };
  }
}

export function getStorage(): IStorage {
  if (process.env.USE_MONGO === "1" || process.env.USE_MONGO === "true") {
    return new MongoStorage();
  }
  return new DatabaseStorage();
}
