"use client";

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

export function FloatingOrderButton() {
  const { data: orders } = trpc.orders.getBuyerOrders.useQuery();

  // Filter for active orders (pending, confirmed, delivering)
  const activeCount = orders?.filter((order) => 
    ["pending", "confirmed", "delivering"].includes(order.status)
  ).length || 0;

  if (activeCount === 0) return null;

  return (
    <Link
      href="/buyer/orders"
      className="fixed bottom-6 right-6 z-40 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
    >
      <span className="text-xl">🛍️</span>
      <span className="font-bold">{activeCount} Orders</span>
    </Link>
  );
}
