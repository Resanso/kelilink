
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
        vendorId: productsTable.vendorId,
        vendor: {
          name: usersTable.name,
          avatarUrl: usersTable.avatarUrl,
          phoneNumber: usersTable.phoneNumber,
        },
      })
      .from(productsTable)
      .innerJoin(usersTable, eq(productsTable.vendorId, usersTable.id))
      .where(eq(productsTable.isAvailable, true));

    return products;
  }),

  create: protectedProcedure
    .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        imageUrl: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
        await ctx.db.insert(productsTable).values({
            vendorId: ctx.session.user.id,
            name: input.name,
            description: input.description,
            price: input.price,
            imageUrl: input.imageUrl,
            isAvailable: true
        });
        return { success: true };
    }),

  getMyProducts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(productsTable)
      .where(eq(productsTable.vendorId, ctx.session.user.id))
      .orderBy(productsTable.createdAt);
  }),
});
