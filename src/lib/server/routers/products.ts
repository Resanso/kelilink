
import { z } from "zod";
import { router, protectedProcedure } from "@/lib/server/trpc";
import { productsTable } from "@/lib/db/schema/products";
import { usersTable } from "@/lib/db/schema/users";
import { eq, and } from "drizzle-orm";

export const productsRouter = router({
  getAvailable: protectedProcedure.query(async ({ ctx }) => {
    const products = await ctx.db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        price: productsTable.price,
        imageUrl: productsTable.imageUrl,
        vendor: {
          name: usersTable.name,
          avatarUrl: usersTable.avatarUrl,
        },
      })
      .from(productsTable)
      .innerJoin(usersTable, eq(productsTable.vendorId, usersTable.id))
      .where(eq(productsTable.isAvailable, true));

    return products;
  }),
});
