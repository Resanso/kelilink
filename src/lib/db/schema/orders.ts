import { integer, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "delivering",
  "completed",
  "cancelled",
]);

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").default("pending").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  priceAtOrder: integer("price_at_order").notNull(),
});

export type InsertOrder = typeof ordersTable.$inferInsert;
export type SelectOrder = typeof ordersTable.$inferSelect;
export type InsertOrderItem = typeof orderItemsTable.$inferInsert;
export type SelectOrderItem = typeof orderItemsTable.$inferSelect;
