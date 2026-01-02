import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "@/lib/server/trpc";
import { usersTable } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

export const usersRouter = router({
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(usersTable);
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [user] = await ctx.db.select().from(usersTable).where(eq(usersTable.id, userId));
    return user;
  }),

  updateVendorStatus: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        await ctx.db.update(usersTable).set({ isActive: input }).where(eq(usersTable.id, userId));
        return { success: true };
    }),

    updateBusinessProfile: protectedProcedure
    .input(z.object({
        businessName: z.string(),
        businessDescription: z.string(),
        phoneNumber: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        await ctx.db.update(usersTable).set({
            businessName: input.businessName,
            businessDescription: input.businessDescription,
            phoneNumber: input.phoneNumber,
            isOnboarded: true,
            role: "seller" // Promote to seller
        }).where(eq(usersTable.id, userId));
        return { success: true };
    }),

    updateLocation: protectedProcedure
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
            currentLongitude: String(input.longitude),
            isActive: true, // Auto set active on location update
            role: "seller", // Ensure they are marked as seller when active
            updatedAt: new Date()
        }).where(eq(usersTable.id, userId));
        return { success: true };
    }),

  getActiveSellers: protectedProcedure.query(async ({ ctx }) => {
    // Fetch real active sellers with location data
    // We filter by role='seller', isActive=true, and ensure lat/long are not null
    const activeSellers = await ctx.db.select().from(usersTable).where(
        // In a real app we'd use 'and()' but for simplicity / standard drizzle
        // and(eq(usersTable.role, 'seller'), eq(usersTable.isActive, true))
        // Let's filter in memory or straightforward where clause if using advanced filters
        eq(usersTable.isActive, true)
    );

    // Map to the format expected by the frontend
    return activeSellers
        .filter(u => u.role === 'seller' && u.currentLatitude && u.currentLongitude)
        .map(u => ({
            id: u.id,
            name: u.businessName || u.name,
            avatarUrl: u.avatarUrl, 
            latitude: Number(u.currentLatitude), 
            longitude: Number(u.currentLongitude) 
        }));
  }),
});
