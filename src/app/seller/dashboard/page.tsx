"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Image from "next/image";
import { LogoutButton } from "@/components/auth/logout-button";

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"incoming" | "active" | "history">("incoming");
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const router = useRouter();
  
  const utils = trpc.useUtils();
  
  // Queries
  const { data: orders, isLoading } = trpc.orders.getVendorOrders.useQuery({ status: activeTab });
  
  // Mutations
  const updateStatusMutation = trpc.users.updateVendorStatus.useMutation({
      onSuccess: () => utils.users.getUsers.invalidate() // Optional refresh
  });
  
  const acceptOrder = trpc.orders.acceptOrder.useMutation({ onSuccess: () => utils.orders.getVendorOrders.invalidate() });
  const rejectOrder = trpc.orders.rejectOrder.useMutation({ onSuccess: () => utils.orders.getVendorOrders.invalidate() });
  
  const startDelivery = trpc.orders.startDelivery.useMutation({ 
      onSuccess: (_, variables) => {
          utils.orders.getVendorOrders.invalidate();
          router.push(`/seller/orders/${variables.orderId}/delivery`);
      } 
  });

  // Toggle Vendor Status
  const toggleStatus = () => {
      const newState = !isVendorOpen;
      setIsVendorOpen(newState);
      updateStatusMutation.mutate(newState);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                   {/* Placeholder Avatar */}
                   <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                   </svg>
               </div>
               <div>
                   <h1 className="font-bold text-lg text-foreground">Kedai Paman Joe</h1>
                   <p className="text-xs text-muted-foreground">Seller Dashboard</p>
               </div>
           </div>
           <LogoutButton />
        </div>

        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Today's Earnings</p>
                <p className="text-2xl font-bold text-primary">Rp 450.000</p>
            </div>
            <button 
                onClick={toggleStatus}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${isVendorOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
                {isVendorOpen ? "OPEN 🟢" : "CLOSED 🔴"}
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-border/50">
             {(["incoming", "active", "history"] as const).map((tab) => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg capitalize transition-all ${
                        activeTab === tab ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
                    }`}
                 >
                     {tab}
                 </button>
             ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 mt-6 space-y-4">
          {isLoading ? (
              <p className="text-center text-muted-foreground py-10">Loading orders...</p>
          ) : orders?.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center opacity-50">
                  <span className="text-4xl mb-4">📦</span>
                  <p className="text-muted-foreground font-medium">No {activeTab} orders</p>
              </div>
          ) : (
              orders?.map((order) => (
                  <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-border/50">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                                  {order.buyer?.name?.[0] || "B"}
                              </div>
                              <div>
                                  <h3 className="font-bold text-foreground text-sm">{order.buyer?.name || "Guest Buyer"}</h3>
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'delivering' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {order.status}
                                  </span>
                              </div>
                          </div>
                          <p className="font-bold text-primary">{formatPrice(order.totalPrice)}</p>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-xl mb-4">
                          <ul className="space-y-1">
                              {order.items.map((item: any, idx: number) => (
                                  <li key={idx} className="text-sm text-foreground/80 flex justify-between">
                                      <span>{item.quantity}x {item.productName}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                          {order.status === "pending" && (
                              <>
                                <button 
                                    onClick={() => rejectOrder.mutate({ orderId: order.id })}
                                    disabled={rejectOrder.isPending}
                                    className="flex-1 h-10 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100"
                                >
                                    Tolak
                                </button>
                                <button 
                                    onClick={() => acceptOrder.mutate({ orderId: order.id })}
                                    disabled={acceptOrder.isPending}
                                    className="flex-1 h-10 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:opacity-90 shadow-sm"
                                >
                                    Terima
                                </button>
                              </>
                          )}
                          
                          {order.status === "confirmed" && (
                              <button 
                                  onClick={() => startDelivery.mutate({ orderId: order.id })}
                                  disabled={startDelivery.isPending}
                                  className="w-full h-11 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2"
                              >
                                  <span>Mulai Pengantaran</span>
                                  <span>🛵</span>
                              </button>
                          )}

                          {order.status === "delivering" && (
                              <div className="w-full space-y-2">
                                  <div className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                                      <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                                      Sedang Mengantar...
                                  </div>
                                  <Link 
                                      href={`/seller/orders/${order.id}/delivery`}
                                      className="w-full h-11 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 shadow-sm flex items-center justify-center"
                                  >
                                      Lanjut Pengantaran ➡️
                                  </Link>
                              </div>
                          )}
                           {order.status === "completed" && (
                              <div className="w-full text-center text-xs font-bold text-gray-400">
                                  Order Completed
                              </div>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
}
