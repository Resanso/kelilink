import { z } from "zod";
import { router, protectedProcedure } from "@/lib/server/trpc";
import { ordersTable, orderItemsTable } from "@/lib/db/schema/orders";
import { productsTable } from "@/lib/db/schema/products";
import { usersTable } from "@/lib/db/schema/users";
import { eq, desc, inArray, and } from "drizzle-orm";

export const ordersRouter = router({
  getBuyerOrders: protectedProcedure.query(async ({ ctx }) => {
    const buyerId = ctx.session.user.id;

    const orders = await ctx.db
      .select({
        id: ordersTable.id,
        status: ordersTable.status,
        totalPrice: ordersTable.totalPrice,
        createdAt: ordersTable.createdAt,
        vendor: {
          name: usersTable.name,
          avatarUrl: usersTable.avatarUrl,
        },
      })
      .from(ordersTable)
      // Join with Vendor details (usersTable)
      .innerJoin(usersTable, eq(ordersTable.vendorId, usersTable.id))
      .where(eq(ordersTable.buyerId, buyerId))
      .orderBy(desc(ordersTable.createdAt));

    return orders;
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

        // 2. Calculate Total Price & Prepare Order Items
        let totalPrice = 0;
        const orderItemsToInsert: {
          orderId: string;
          productId: string;
          quantity: number;
          priceAtOrder: number;
        }[] = [];

        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new Error(`Product match not found for ID: ${item.productId}`);
          }
          if (product.vendorId !== vendorId) {
             throw new Error(`Product ${product.name} does not belong to the selected vendor.`);
          }

          const itemTotal = product.price * item.quantity;
          totalPrice += itemTotal;

          orderItemsToInsert.push({
            // orderId will be filled later
            orderId: "", 
            productId: product.id,
            quantity: item.quantity,
            priceAtOrder: product.price,
          });
        }

        // 3. Create Order
        const [newOrder] = await tx
          .insert(ordersTable)
          .values({
            buyerId,
            vendorId,
            status: "pending",
            totalPrice,
          })
          .returning({ id: ordersTable.id });

        // 4. Create Order Items
        if (orderItemsToInsert.length > 0) {
          await tx.insert(orderItemsTable).values(
            orderItemsToInsert.map((item) => ({
              ...item,
              orderId: newOrder.id,
            }))
          );
        }

        return { orderId: newOrder.id };
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
});
