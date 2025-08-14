import { calls, type Call, type InsertCall, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
    // Legacy user methods - keeping for compatibility
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Legacy user methods - keeping for compatibility
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Legacy user methods - keeping for compatibility
    throw new Error("User creation not implemented");
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
