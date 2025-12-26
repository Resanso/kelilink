import { router } from "@/lib/server/trpc";
import { usersRouter } from "./users";
import { ordersRouter } from "./orders";
import { productsRouter } from "./products";

export const appRouter = router({
  users: usersRouter,
  orders: ordersRouter,
  products: productsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
