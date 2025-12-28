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

  getActiveSellers: protectedProcedure.query(async () => {
    // RETURNS DUMMY DATA FOR DEMO
    // Center: Telkom University [-6.9751, 107.6319]
    return [
        { id: "driver-1", name: "Mang Ujang (Bakso)", avatarUrl: null, latitude: -6.9755, longitude: 107.6325 },
        { id: "driver-2", name: "Ceu Iroh (Seblak)", avatarUrl: null, latitude: -6.9748, longitude: 107.6310 },
        { id: "driver-3", name: "Kang Asep (Siomay)", avatarUrl: null, latitude: -6.9760, longitude: 107.6315 },
        { id: "driver-4", name: "Warung Nasi padang", avatarUrl: null, latitude: -6.9745, longitude: 107.6330 },
        { id: "driver-5", name: "Es Cendol Elizabeth", avatarUrl: null, latitude: -6.9758, longitude: 107.6305 },
    ];
  }),
});
