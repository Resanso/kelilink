import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InsertProduct = typeof productsTable.$inferInsert;
export type SelectProduct = typeof productsTable.$inferSelect;
