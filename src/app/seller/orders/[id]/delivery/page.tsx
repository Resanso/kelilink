"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import dynamic from "next/dynamic";
import Link from 'next/link';

// Dynamic import for Leaflet map (same as Buyer Tracking)
const MapOrders = dynamic(() => import("@/components/map/MapOrders"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse">Loading Map...</div> 
});

export default function SellerDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [mounted, setMounted] = useState(false);

  const utils = trpc.useUtils();
  const { data: order, isLoading, error } = trpc.orders.getOrderById.useQuery({ orderId });

  // const updateLocation = trpc.users.updateDummyLocation.useMutation(); // Handled by MapOrders simulation now
  
  const completeOrder = trpc.orders.completeOrder.useMutation({
    onSuccess: () => {
        utils.orders.getVendorOrders.invalidate();
        router.push(`/seller/orders/${orderId}/completed`);
    }
  });

  // Ensure client-side mounting for Leaflet
  useEffect(() => {
      setMounted(true);
  }, []);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-background flex items-center justify-center text-red-500">Error: {error.message}</div>;
  if (!order) return <div className="min-h-screen bg-background flex items-center justify-center">Order not found</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
          {mounted && (
              <MapOrders 
                vendorName="You"
                buyerName={order.buyer?.name || "Buyer"}
                onArrival={() => {
                   // Optional: Auto-complete or show notification
                   // For seller, we might want manual confirmation, so we won't auto-complete here yet
                }}
              />
          )}
      </div>

       {/* Overlay UI (Top) */}
       <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/50">
             <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-900">Delivery Mode 🛵</h2>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    {order.status}
                </span>
             </div>
             <p className="text-sm text-gray-600">
                Delivering to <span className="font-semibold text-gray-900">{order.buyer?.name || "Buyer"}</span>
             </p>
          </div>
       </div>

      {/* Action Sheet (Floating Card style to match Buyer) */}
      <div className="absolute bottom-6 left-4 right-4 z-20">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50">
              <div className="mb-4 max-h-[20vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-gray-900">Order Items</h3>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(order.totalPrice)}
                      </span>
                  </div>
                  <div className="space-y-1">
                      {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-xs text-gray-600">
                              <span>{item.quantity}x {item.productName}</span>
                          </div>
                      ))}
                  </div>
              </div>

              <button 
                onClick={() => completeOrder.mutate({ orderId })}
                disabled={completeOrder.isPending}
                className="w-full h-12 bg-green-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                 {completeOrder.isPending ? "Confirming..." : "Mark Delivered ✅"}
              </button>
          </div>
      </div>
    </div>
  );
}
