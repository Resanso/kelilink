"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import Image from "next/image";

export default function BuyerOrdersPage() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.orders.getBuyerOrders.useQuery();

  const cancelOrder = trpc.orders.cancelOrder.useMutation({
    onSuccess: () => {
      utils.orders.getBuyerOrders.invalidate();
    },
    onError: (err) => {
        alert("Failed to cancel order: " + err.message);
    }
  });

  const filteredOrders = orders?.filter((order) => {
    if (activeTab === "active") {
      return ["pending", "confirmed", "delivering"].includes(order.status);
    }
    return ["completed", "cancelled"].includes(order.status);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "delivering":
        return "bg-indigo-100 text-indigo-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
      </div>

      <div className="px-4 mt-4">
        <div className="flex space-x-2 bg-gray-200 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "active"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "history"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            History
          </button>
        </div>

        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden relative">
                        {order.vendor.avatarUrl ? (
                             <Image 
                                src={order.vendor.avatarUrl} 
                                alt={order.vendor.name || 'Vendor'} 
                                fill
                                className="object-cover"
                             />
                        ) : (
                            <span className="flex items-center justify-center h-full w-full text-xs font-bold text-gray-500">
                                {order.vendor.name?.charAt(0) || "V"}
                            </span>
                        )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {order.vendor.name || "Unknown Vendor"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                  <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Price</p>
                      <p className="font-bold text-gray-900">
                        {formatPrice(order.totalPrice)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                        {(order.status === "pending") && (
                            <Link
                                href={`/buyer/orders/${order.id}/payment`}
                                className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                Pay Now
                            </Link>
                        )}
                        {(order.status === "pending" || order.status === "confirmed") && (
                        <button
                            onClick={() => {
                            if (confirm("Are you sure you want to cancel this order?")) {
                                cancelOrder.mutate({ orderId: order.id });
                            }
                            }}
                            disabled={cancelOrder.isPending}
                            className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            {cancelOrder.isPending ? "..." : "Cancel"}
                        </button>
                        )}
                         {(order.status === "delivering") && (
                            <Link
                                href={`/tracking/${order.id}`}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors shadow-sm animate-pulse"
                            >
                                Track 📍
                            </Link>
                        )}
                    </div>
                  </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No orders found</h3>
            <p className="text-gray-500 text-sm">
              {activeTab === "active"
                ? "You don't have any active orders."
                : "You haven't placed any orders yet."}
            </p>
            {activeTab === "history" && (
                <button 
                    onClick={() => setActiveTab('active')}
                    className="mt-4 text-blue-600 text-sm font-medium hover:text-blue-800"
                >
                    View Active Orders
                </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
