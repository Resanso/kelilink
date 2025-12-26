import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["buyer", "seller"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name"),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").default("buyer").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
