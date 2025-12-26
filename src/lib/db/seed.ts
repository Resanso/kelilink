import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { db } from "./index";
import { productsTable } from "./schema/products";
import { ordersTable, orderItemsTable } from "./schema/orders";
import { eq } from "drizzle-orm";
import { usersTable } from "./schema/users";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in .env.local for seeding.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("🌱 Starting seeding...");

  const users = [
    {
      email: "mang.bakso@example.com",
      password: "password123",
      name: "Mang Bakso",
      role: "seller",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    },
    {
      email: "pak.mie@example.com",
      password: "password123",
      name: "Pak Mie Ayam",
      role: "seller",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    },
    {
      email: "si.lapar@example.com",
      password: "password123",
      name: "Si Lapar",
      role: "buyer",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lapar",
    },
  ];

  const createdUsers: Record<string, string> = {};

  for (const u of users) {
    console.log(`Creating user: ${u.email}`);
    
    // Check if user exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData.users.find(user => user.email === u.email);

    let userId = existingUser?.id;

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true, // Auto confirm email
        user_metadata: {
          name: u.name,
          role: u.role,
          avatar_url: u.avatarUrl,
        },
      });

      if (error) {
        console.error(`Error creating ${u.email}:`, error.message);
        continue;
      }
      userId = data.user?.id;
    } else {
        console.log(`User ${u.email} already exists.`);
    }

    if (userId) {
      createdUsers[u.email] = userId;
    }
  }

  // Wait a bit for triggers to propagate to public.users (optional, but safe)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const mangBaksoId = createdUsers["mang.bakso@example.com"];
  const pakMieId = createdUsers["pak.mie@example.com"];
  const siLaparId = createdUsers["si.lapar@example.com"];

  if (!mangBaksoId || !pakMieId || !siLaparId) {
    console.error("Failed to get all user IDs. Aborting seed.");
    return;
  }

  console.log("🍔 Seeding Products...");
  
  // Products for Mang Bakso
  const baksoProducts = await db.insert(productsTable).values([
    {
      vendorId: mangBaksoId,
      name: "Bakso Urat Besar",
      price: 15000,
      imageUrl: "https://images.unsplash.com/photo-1626508000378-b3d452077f8a?auto=format&fit=crop&q=80&w=300",
      isAvailable: true,
    },
    {
      vendorId: mangBaksoId,
      name: "Bakso Telur",
      price: 18000,
      imageUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a2c3?auto=format&fit=crop&q=80&w=300",
      isAvailable: true,
    },
  ]).returning();

  // Products for Pak Mie Ayam
  const mieProducts = await db.insert(productsTable).values([
    {
      vendorId: pakMieId,
      name: "Mie Ayam Komplit",
      price: 12000,
      imageUrl: "https://images.unsplash.com/photo-1606820063223-93d39999126c?auto=format&fit=crop&q=80&w=300",
      isAvailable: true,
    },
    {
      vendorId: pakMieId,
      name: "Es Teh Manis",
      price: 4000,
      isAvailable: true,
    },
  ]).returning();

  console.log("📦 Seeding Orders...");

  // Order 1: Pending (Bakso)
  const order1 = await db.insert(ordersTable).values({
    buyerId: siLaparId,
    vendorId: mangBaksoId,
    status: "pending",
    totalPrice: 33000,
    createdAt: new Date(),
  }).returning();

  await db.insert(orderItemsTable).values([
    {
      orderId: order1[0].id,
      productId: baksoProducts[0].id,
      quantity: 1,
      priceAtOrder: 15000,
    },
    {
      orderId: order1[0].id,
      productId: baksoProducts[1].id,
      quantity: 1,
      priceAtOrder: 18000,
    },
  ]);

  // Order 2: Delivering (Mie Ayam)
  const order2 = await db.insert(ordersTable).values({
    buyerId: siLaparId,
    vendorId: pakMieId,
    status: "delivering",
    totalPrice: 16000,
    createdAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
  }).returning();

  await db.insert(orderItemsTable).values([
    {
      orderId: order2[0].id,
      productId: mieProducts[0].id,
      quantity: 1,
      priceAtOrder: 12000,
    },
    {
      orderId: order2[0].id,
      productId: mieProducts[1].id,
      quantity: 1,
      priceAtOrder: 4000,
    },
  ]);

   // Order 3: Completed (Bakso)
   const order3 = await db.insert(ordersTable).values({
    buyerId: siLaparId,
    vendorId: mangBaksoId,
    status: "completed",
    totalPrice: 15000,
    createdAt: new Date(Date.now() - 86400 * 1000), // 1 day ago
  }).returning();

  await db.insert(orderItemsTable).values([
    {
      orderId: order3[0].id,
      productId: baksoProducts[0].id,
      quantity: 1,
      priceAtOrder: 15000,
    },
  ]);

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
