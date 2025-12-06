import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Menu Schema
export interface Menu {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  createdAt: Date;
}

export interface InsertMenu {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available?: boolean;
}

// Cart Item Schema
export interface CartItem {
  menuId: string;
  menuName: string;
  price: number;
  quantity: number;
  image: string;
}

// Order Schema
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: Date;
}

export interface InsertOrder {
  userId: string;
  items: CartItem[];
  total: number;
  status?: "pending" | "processing" | "completed" | "cancelled";
}

// Review Schema
export interface Review {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  menuName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface InsertReview {
  orderId: string;
  userId: string;
  userName: string;
  menuName: string;
  rating: number;
  comment: string;
}
