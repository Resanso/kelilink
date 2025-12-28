import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["buyer", "seller"] }).default("buyer").notNull(),
  avatarUrl: text("avatar_url"),
  
  // Vendor Specific Fields
  isActive: boolean("is_active").default(false),
  currentLatitude: text("current_latitude"),
  currentLongitude: text("current_longitude"),
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  phoneNumber: text("phone_number"),
  isOnboarded: boolean("is_onboarded").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
