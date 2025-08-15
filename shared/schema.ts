import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  status: text("status").notNull(),
  notes: text("notes"),
  recording_url: text("recording_url"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertCallSchema = createInsertSchema(calls).pick({
  name: true,
  company: true,
  email: true,
  phone: true,
  status: true,
  notes: true,
  recording_url: true,
});

export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

// Legacy user schema (keeping for compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Optional: user settings for Postgres path
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  vapiPrivateKey: text("vapi_private_key"),
  assistantId: text("assistant_id"),
  phoneNumberId: text("phone_number_id"),
  defaultCustomerNumber: text("default_customer_number"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  vapiPrivateKey: true,
  assistantId: true,
  phoneNumberId: true,
  defaultCustomerNumber: true,
});

export const updateUserSettingsSchema = z.object({
  vapiPrivateKey: z.string().optional(),
  assistantId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  defaultCustomerNumber: z.string().optional(),
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
