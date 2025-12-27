import { z } from "zod";
import { router, protectedProcedure } from "@/lib/server/trpc";
import { ordersTable, orderItemsTable } from "@/lib/db/schema/orders";
import { productsTable } from "@/lib/db/schema/products";
import { usersTable } from "@/lib/db/schema/users";
import { eq, desc, inArray, and } from "drizzle-orm";

export const ordersRouter = router({
  getBuyerOrders: protectedProcedure.query(async ({ ctx }) => {
    const buyerId = ctx.session.user.id;

    // Fetch orders with items and product details
    const rawRows = await ctx.db
      .select({
        order: ordersTable,
        vendor: {
          name: usersTable.name,
          avatarUrl: usersTable.avatarUrl,
        },
        item: orderItemsTable,
        product: {
          name: productsTable.name,
        },
      })
      .from(ordersTable)
      .innerJoin(usersTable, eq(ordersTable.vendorId, usersTable.id))
      .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
      .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(ordersTable.buyerId, buyerId))
      .orderBy(desc(ordersTable.createdAt));

    // Group by Order ID
    const ordersMap = new Map();

    for (const row of rawRows) {
      if (!ordersMap.has(row.order.id)) {
        ordersMap.set(row.order.id, {
          ...row.order,
          vendor: row.vendor,
          items: [],
        });
      }

      if (row.item && row.product) {
        ordersMap.get(row.order.id).items.push({
          ...row.item,
          productName: row.product.name,
        });
      }
    }

    return Array.from(ordersMap.values());
  }),


  create: protectedProcedure
    .input(
      z.object({
        vendorId: z.string().uuid(),
        items: z.array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.number().min(1),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { vendorId, items } = input;
      const buyerId = ctx.session.user.id;

      return await ctx.db.transaction(async (tx) => {
        // 1. Fetch products to get current prices
        const productIds = items.map((item) => item.productId);
        const products = await tx
          .select()
          .from(productsTable)
          .where(inArray(productsTable.id, productIds));

        // Create a map for easy lookup
        const productMap = new Map(products.map((p) => [p.id, p]));

        // Calculate Cost of New Items
        let newItemsTotal = 0;
        const newOrderItems: {
          orderId: string;
          productId: string;
          quantity: number;
          priceAtOrder: number;
        }[] = [];

        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product) throw new Error(`Product match not found for ID: ${item.productId}`);
          if (product.vendorId !== vendorId) throw new Error(`Product ${product.name} does not belong to the selected vendor.`);

          const itemTotal = product.price * item.quantity;
          newItemsTotal += itemTotal;

          newOrderItems.push({
            orderId: "", // placeholder
            productId: product.id,
            quantity: item.quantity,
            priceAtOrder: product.price,
          });
        }

        // 2. Check for EXISTING Pending Order for this Vendor & Buyer
        const [existingOrder] = await tx
            .select()
            .from(ordersTable)
            .where(
                and(
                    eq(ordersTable.buyerId, buyerId),
                    eq(ordersTable.vendorId, vendorId),
                    eq(ordersTable.status, "pending")
                )
            );

        let activeOrderId = "";

        if (existingOrder) {
            // APPEND to Existing Order
            activeOrderId = existingOrder.id;
            
            // Update Total Price
            await tx
                .update(ordersTable)
                .set({ 
                    totalPrice: existingOrder.totalPrice + newItemsTotal,
                    // Optionally update updatedAt
                })
                .where(eq(ordersTable.id, activeOrderId));

        } else {
            // CREATE New Order
            const [newOrder] = await tx
              .insert(ordersTable)
              .values({
                buyerId,
                vendorId,
                status: "pending",
                totalPrice: newItemsTotal,
              })
              .returning({ id: ordersTable.id });
            
            activeOrderId = newOrder.id;
        }

        // 3. Insert Items (linked to activeOrderId)
        if (newOrderItems.length > 0) {
            // Check for existing items in this order to merge quantities (Cart logic)
            // For simplicity in this iteration, we will simply append rows. 
            // Ideally, we would upsert or sum quantities.
            // Let's do a quick check to see if we can merge in memory or just insert.
            // "Insert" is safest for now to avoid complexity with primary keys if they exist on items.
            
           await tx.insert(orderItemsTable).values(
             newOrderItems.map((item) => ({
               ...item,
               orderId: activeOrderId,
             }))
           );
         }

        return { orderId: activeOrderId };
      });
    }),


  getVendorOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "history"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const vendorId = ctx.session.user.id;
      const { status } = input;

      let statusFilter = undefined;
      if (status === "active") {
        statusFilter = inArray(ordersTable.status, [
          "pending",
          "confirmed",
          "delivering",
        ]);
      } else if (status === "history") {
        statusFilter = inArray(ordersTable.status, ["completed", "cancelled"]);
      }

      // Fetch flat data (Order + Buyer + Items + Product)
      // Note: This matches one-to-many, so orders will be duplicated for each item.
      const rawRows = await ctx.db
        .select({
          order: ordersTable,
          buyer: {
            name: usersTable.name,
            avatarUrl: usersTable.avatarUrl,
          },
          item: orderItemsTable,
          product: {
            name: productsTable.name,
          },
        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(ordersTable.buyerId, usersTable.id))
        .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
        .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
        .where(
          and(
            eq(ordersTable.vendorId, vendorId),
            statusFilter 
          )
        )
        .orderBy(desc(ordersTable.createdAt));

      // Group by Order ID
      const ordersMap = new Map();

      for (const row of rawRows) {
        if (!ordersMap.has(row.order.id)) {
          ordersMap.set(row.order.id, {
            ...row.order,
            buyer: row.buyer,
            items: [],
          });
        }
        
        if (row.item && row.product) {
          ordersMap.get(row.order.id).items.push({
            ...row.item,
            productName: row.product.name,
          });
        }
      }

      return Array.from(ordersMap.values());
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        newStatus: z.enum([
          "confirmed",
          "delivering",
          "completed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, newStatus } = input;
      const vendorId = ctx.session.user.id;

      // 1. Verify Ownership & Current Status
      const [order] = await ctx.db
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.id, orderId), eq(ordersTable.vendorId, vendorId)));

      if (!order) {
        throw new Error("Order not found or unauthorized");
      }

      // 2. Validate Transitions (Optional but recommended)
      // e.g. Can only complete if delivering
      if (newStatus === "completed" && order.status !== "delivering") {
        throw new Error("Order must be 'delivering' before it can be completed.");
      }

      // 3. Update Status
      await ctx.db
        .update(ordersTable)
        .set({ status: newStatus })
        .where(eq(ordersTable.id, orderId));

      return { success: true };
    }),


  cancelOrder: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { orderId } = input;
      const buyerId = ctx.session.user.id;

      const [order] = await ctx.db
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.id, orderId), eq(ordersTable.buyerId, buyerId)));

      if (!order) {
        throw new Error("Order not found or unauthorized");
      }

      if (["delivering", "completed", "cancelled"].includes(order.status)) {
        throw new Error("Cannot cancel order in current status");
      }

      await ctx.db
        .update(ordersTable)
        .set({ status: "cancelled" })
        .where(eq(ordersTable.id, orderId));

      return { success: true };
    }),


  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { orderId } = input;
      const userId = ctx.session.user.id; // Could be buyer or vendor

      // Fetch order with related data
      const rows = await ctx.db
        .select({
          order: ordersTable,
          vendor: {
            name: usersTable.name,
            avatarUrl: usersTable.avatarUrl,
          },
          item: orderItemsTable,
          product: {
             name: productsTable.name,
             price: productsTable.price,
          }
        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(ordersTable.vendorId, usersTable.id))
        .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
        .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
        .where(
             and(
                 eq(ordersTable.id, orderId),
                 // Simple access control: user must be buyer OR vendor
                 // Ideally split into separate checks, but for now this works if we trust the IDs
                 // Or we can just let any authenticated user view (less secure)
                 // Let's rely on filter below or strict check
             )
        );

      if (rows.length === 0) {
         throw new Error("Order not found");
      }
      
      const firstRow = rows[0];
      // Access check
      if (firstRow.order.buyerId !== userId && firstRow.order.vendorId !== userId) {
         throw new Error("Unauthorized");
      }

      // Group items
      const items = rows.map(r => ({
          ...r.item,
          productName: r.product?.name || "Unknown Product",
          productPrice: r.product?.price || 0
      })).filter(i => i.id); // Filter out nulls if any (left join)

      return {
          ...firstRow.order,
          vendor: firstRow.vendor,
          items
      };
    }),

  payOrder: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { orderId } = input;
      const buyerId = ctx.session.user.id;

      const [order] = await ctx.db
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.id, orderId), eq(ordersTable.buyerId, buyerId)));

      if (!order) throw new Error("Order not found or unauthorized");

      // Skipping 'confirmed' based on requirements, straight to 'delivering'
      await ctx.db
        .update(ordersTable)
        .set({ status: "delivering" })
        .where(eq(ordersTable.id, orderId));

      return { success: true };
    }),

  checkoutAllPending: protectedProcedure
    .mutation(async ({ ctx }) => {
      const buyerId = ctx.session.user.id;

      // 1. Get all pending orders
      const pendingOrders = await ctx.db
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.buyerId, buyerId), eq(ordersTable.status, "pending")));

      if (pendingOrders.length === 0) {
        throw new Error("No pending orders to checkout");
      }

      // 2. Update all to 'delivering' (Simulate Payment)
      await ctx.db
        .update(ordersTable)
        .set({ status: "delivering" })
        .where(and(eq(ordersTable.buyerId, buyerId), eq(ordersTable.status, "pending")));

        return { success: true, count: pendingOrders.length };
    }),

  confirmDelivery: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { orderId } = input;
      const buyerId = ctx.session.user.id;

      const [order] = await ctx.db
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.id, orderId), eq(ordersTable.buyerId, buyerId)));

      if (!order) throw new Error("Order not found or unauthorized");

      if (order.status !== "delivering") {
        throw new Error("Order is not in delivering status");
      }

      await ctx.db
        .update(ordersTable)
        .set({ status: "completed" })
        .where(eq(ordersTable.id, orderId));

      return { success: true };
    }),
});
