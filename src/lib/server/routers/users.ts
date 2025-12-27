import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "@/lib/server/trpc";
import { usersTable } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

export const usersRouter = router({
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(usersTable);
  }),

  updateVendorStatus: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        await ctx.db.update(usersTable).set({ isActive: input }).where(eq(usersTable.id, userId));
        return { success: true };
    }),

  updateDummyLocation: protectedProcedure
    .input(z.object({
        latitude: z.number(),
        longitude: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        // Store as string to match schema if it's text, or number if schema changed.
        // Checking schema: extended with text columns currentLatitude, currentLongitude
        await ctx.db.update(usersTable).set({ 
            currentLatitude: String(input.latitude),
            currentLongitude: String(input.longitude)
        }).where(eq(usersTable.id, userId));
        return { success: true };
    }),
});
