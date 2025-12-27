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

  const checkoutAllMutation = trpc.orders.checkoutAllPending.useMutation({
     onSuccess: () => {
        utils.orders.getBuyerOrders.invalidate();
        alert("All orders paid successfully! Drivers are on their way. 🏎️");
     },
     onError: (err) => {
        alert("Checkout failed: " + err.message);
     }
  });

  const filteredOrders = orders?.filter((order) => {
    if (activeTab === "active") {
      return ["pending", "confirmed", "delivering"].includes(order.status);
    }
    return ["completed", "cancelled"].includes(order.status);
  });
  
  const pendingOrders = orders?.filter(o => o.status === "pending") || [];
  const totalPendingPrice = pendingOrders.reduce((sum, order) => sum + order.totalPrice, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "delivering":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "completed":
        return "bg-green-50 text-green-700 border border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-muted text-muted-foreground";
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
      <div className="space-y-4 p-4 max-w-md mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card w-full p-6 rounded-2xl shadow-sm border border-border/50 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen pb-32">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-4 border-b border-border/50">
        <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
      </div>

      <div className="px-4 mt-6">
        <div className="flex bg-muted/50 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "active"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History
          </button>
        </div>

        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-card w-full p-5 rounded-2xl shadow-sm border border-border/50 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted border border-border">
                        {order.vendor.avatarUrl ? (
                             <Image 
                                src={order.vendor.avatarUrl} 
                                alt={order.vendor.name || 'Vendor'} 
                                fill
                                className="object-cover"
                             />
                        ) : (
                            <span className="flex items-center justify-center h-full w-full text-xs font-bold text-muted-foreground">?</span>
                        )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base leading-tight">
                        {order.vendor.name || "Unknown Vendor"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                  {/* Order Items */}
                  <div className="bg-muted/30 rounded-xl p-3 mb-3 border border-border/50">
                    <ul className="space-y-1">
                        {order.items.map((item: any) => (
                            <li key={item.id} className="text-sm flex justify-between text-foreground/80">
                                <span>{item.quantity}x {item.productName}</span>
                                {/* Optional: Show individual price if needed, but Total is usually enough here */}
                            </li>
                        ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/50 pt-4 mt-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                      <p className="font-bold text-lg text-foreground">
                        {formatPrice(order.totalPrice)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {(order.status === "pending") && (
                            <Link
                                href={`/buyer/orders/${order.id}/payment`}
                                className="h-10 px-4 flex items-center bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
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
                            className="h-10 px-4 flex items-center bg-destructive/10 text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                            {cancelOrder.isPending ? "..." : "Cancel"}
                        </button>
                        )}
                         {(order.status === "delivering") && (
                            <Link
                                href={`/tracking/${order.id}`}
                                className="h-10 px-4 flex items-center bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm animate-pulse"
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
          <div className="text-center py-20">
            <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl grayscale">🧾</span>
            </div>
            <h3 className="text-foreground text-lg font-bold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {activeTab === "active"
                ? "You don't have any active food orders right now."
                : "You haven't ordered any food yet."}
            </p>
            {activeTab === "history" && (
                <button 
                    onClick={() => setActiveTab('active')}
                    className="mt-6 text-primary font-semibold text-sm hover:underline"
                >
                    View Active Orders
                </button>
            )}
          </div>
        )}

      {/* Checkout All Fixed Bar */}
      {activeTab === "active" && pendingOrders.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/50 p-4">
               <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                    <div>
                         <p className="text-xs font-medium text-muted-foreground uppercase">Total Pending</p>
                         <p className="text-xl font-bold text-foreground">{formatPrice(totalPendingPrice)}</p>
                    </div>
                    <button
                        onClick={() => checkoutAllMutation.mutate()}
                        disabled={checkoutAllMutation.isPending}
                        className="h-12 px-6 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {checkoutAllMutation.isPending ? (
                             <span>Processing...</span>
                        ) : (
                             <>
                                <span>Checkout All ({pendingOrders.length})</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                             </>
                        )}
                    </button>
               </div>
          </div>
      )}

      </div>
    </div>
  );
}
