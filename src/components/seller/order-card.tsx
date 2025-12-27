"use client";

import { trpc } from "@/lib/trpc/client";
import { type RouterOutputs } from "@/lib/trpc/client"; 
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Order = RouterOutputs["orders"]["getVendorOrders"][number];

export function SellerOrderCard({ order }: { order: Order }) {
  const utils = trpc.useUtils();
  const router = useRouter(); // Import needed

  const acceptOrder = trpc.orders.acceptOrder.useMutation({ onSuccess: () => utils.orders.getVendorOrders.invalidate() });
  const rejectOrder = trpc.orders.rejectOrder.useMutation({ onSuccess: () => utils.orders.getVendorOrders.invalidate() });
  const startDelivery = trpc.orders.startDelivery.useMutation({ 
      onSuccess: () => {
          utils.orders.getVendorOrders.invalidate();
          router.push(`/seller/orders/${order.id}/delivery`);
      }
  });
  const completeOrder = trpc.orders.completeOrder.useMutation({ onSuccess: () => utils.orders.getVendorOrders.invalidate() });

  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: "confirmed" | "delivering" | "completed" | "cancelled") => {
    setIsLoading(true);
    try {
      if (newStatus === "confirmed") {
          await acceptOrder.mutateAsync({ orderId: order.id });
      } else if (newStatus === "cancelled") {
          await rejectOrder.mutateAsync({ orderId: order.id });
      } else if (newStatus === "delivering") {
          await startDelivery.mutateAsync({ orderId: order.id });
      } else if (newStatus === "completed") {
          await completeOrder.mutateAsync({ orderId: order.id });
      }
    } catch (error) {
      alert("Failed to update status");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const statusColors = {
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
    delivering: "bg-purple-50 text-purple-700 border border-purple-200",
    completed: "bg-green-50 text-green-700 border border-green-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <div className="bg-card w-full rounded-2xl shadow-sm border border-border/50 p-5 transition-shadow hover:shadow-md">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted border border-border">
            {order.buyer.avatarUrl ? (
              <Image
                src={order.buyer.avatarUrl}
                alt={order.buyer.name || "Buyer"}
                fill
                className="object-cover"
              />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg leading-tight">{order.buyer.name || "Unknown Buyer"}</h3>
            <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[order.status as keyof typeof statusColors] || "bg-muted text-muted-foreground"}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-foreground">{formatPrice(order.totalPrice)}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Items Section using muted background for grouping */}
      <div className="bg-muted/30 rounded-xl p-3 space-y-2 mb-5">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-sm items-center">
            <div className="flex items-center gap-2 text-foreground/80">
              <span className="font-semibold text-foreground min-w-[20px]">{item.quantity}x</span> 
              <span>{item.productName}</span>
            </div>
            <span className="text-muted-foreground tabular-nums">
              {formatPrice(item.priceAtOrder * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        {order.status === "pending" && (
          <>
             <button
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={isLoading}
              className="h-12 w-full flex items-center justify-center text-sm font-semibold text-destructive bg-destructive/10 rounded-xl hover:bg-destructive/20 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => handleStatusUpdate("confirmed")}
              disabled={isLoading}
              className="h-12 w-full flex items-center justify-center text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm transition-opacity"
            >
              Confirm
            </button>
          </>
        )}

        {order.status === "confirmed" && (
          <button
            onClick={() => handleStatusUpdate("delivering")}
            disabled={isLoading}
            className="col-span-2 h-12 w-full flex items-center justify-center text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 shadow-sm transition-colors"
          >
            Start Delivery 🛵
          </button>
        )}

        {order.status === "delivering" && (
          <button
            onClick={() => router.push(`/seller/orders/${order.id}/delivery`)}
            disabled={isLoading}
            className="col-span-2 h-12 w-full flex items-center justify-center text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
          >
            Continue Delivery ➡️
          </button>
        )}
      </div>
    </div>
  );
}
