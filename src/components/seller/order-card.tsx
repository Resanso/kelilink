"use client";

import { trpc } from "@/lib/trpc/client";
import { type RouterOutputs } from "@/lib/trpc/client"; // You might need to export this type helper from client.ts or define it
import Image from "next/image";
import { useState } from "react";

// Helper type to get the element type of the array returned by getVendorOrders
type Order = RouterOutputs["orders"]["getVendorOrders"][number];

export function SellerOrderCard({ order }: { order: Order }) {
  const utils = trpc.useUtils();
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.getVendorOrders.invalidate();
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: "confirmed" | "delivering" | "completed" | "cancelled") => {
    setIsLoading(true);
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        newStatus,
      });
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
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    delivering: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            {order.buyer.avatarUrl && (
              <Image
                src={order.buyer.avatarUrl}
                alt={order.buyer.name || "Buyer"}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{order.buyer.name || "Unknown Buyer"}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-gray-100"}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="border-t border-b border-gray-100 py-3 my-3 space-y-2">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.quantity}x {item.productName}
            </span>
            <span className="text-gray-900 font-medium">
              {formatPrice(item.priceAtOrder * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {order.status === "pending" && (
          <>
             <button
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => handleStatusUpdate("confirmed")}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm
            </button>
          </>
        )}

        {order.status === "confirmed" && (
          <button
            onClick={() => handleStatusUpdate("delivering")}
            disabled={isLoading}
            className="col-span-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Start Delivery 🛵
          </button>
        )}

        {order.status === "delivering" && (
          <button
            onClick={() => handleStatusUpdate("completed")}
            disabled={isLoading}
            className="col-span-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Complete Order ✅
          </button>
        )}
      </div>
    </div>
  );
}
