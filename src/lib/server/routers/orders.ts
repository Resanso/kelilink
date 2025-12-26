import { z } from "zod";
import { router, protectedProcedure } from "@/lib/server/trpc";
import { ordersTable } from "@/lib/db/schema/orders";
import { usersTable } from "@/lib/db/schema/users";
import { eq, desc } from "drizzle-orm";

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
});
