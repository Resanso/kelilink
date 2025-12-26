import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { usersTable } from "./schema/users";
import { productsTable } from "./schema/products";
import { orderItemsTable, ordersTable } from "./schema/orders";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(databaseUrl);
export const db = drizzle(client, {
  schema: {
    users: usersTable,
    products: productsTable,
    orders: ordersTable,
    orderItems: orderItemsTable,
  },
});
