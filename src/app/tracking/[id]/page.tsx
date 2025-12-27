"use client";

import { trpc } from "@/lib/trpc/client";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect } from "react";

// Dynamic import for Leaflet map (SSR false)
const MapOrders = dynamic(() => import("@/components/map/MapOrders"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse">Loading Map...</div> 
});

export default function TrackingPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: order, isLoading } = trpc.orders.getOrderById.useQuery({ orderId: id });
  
  // Quick hack to force a re-render or ensure map loads
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const confirmMutation = trpc.orders.confirmDelivery.useMutation({
      onSuccess: () => {
          console.log("Delivery confirmed! Redirecting...");
          router.replace(`/buyer/orders/${id}/completed`);
      },
      onError: (err) => {
          console.error("Auto-completion failed:", err);
          alert("Auto-completion failed. Please use the button.");
      }
  });

  const handleArrival = () => {
    console.log("Handle Arrival Triggered via Animation.");
    // We attempt to confirm regardless of client-side status to avoid synchronization issues.
    // The backend will reject it if it's not 'delivering', which is fine.
    confirmMutation.mutate({ orderId: id });
  };

  if (isLoading) return <div className="p-8 text-center">Loading tracking info...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
       {/* Map Layer */}
       <div className="absolute inset-0 z-0">
          {mounted && (
              <MapOrders 
                vendorName={order.vendor.name || "Vendor"} 
                buyerName="You" 
                onArrival={handleArrival}
              />
          )}
       </div>

       {/* Overlay UI */}
       <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/50">
             <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-900">Live Tracking 🛵</h2>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    {order.status}
                </span>
             </div>
             <p className="text-sm text-gray-600">
                Your order from <span className="font-semibold text-gray-900">{order.vendor.name}</span> is on the way!
             </p>
          </div>
       </div>

       {/* Bottom Sheet / Actions */}
       <div className="absolute bottom-6 left-4 right-4 z-10">
            <Link 
                href="/buyer/orders"
                className="block w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl shadow-lg text-center transition-colors"
            >
                Back to Orders
            </Link>
       </div>
    </div>
  );
}
