"use client";

import { trpc } from "@/lib/trpc/client";
import Image from "next/image";
import { useState } from "react";
import { FloatingOrderButton } from "@/components/buyer/floating-order-button";

export default function BuyerDashboard() {
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.getAvailable.useQuery();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      utils.orders.getBuyerOrders.invalidate();
      // No redirect, just update the UI (bubble count)
    },
    onError: (err) => {
        alert("Failed to create order: " + err.message);
    }
  });

  const [orderingIds, setOrderingIds] = useState<Set<string>>(new Set());

  const handleBuy = (product: any) => {
    // Optimistic UI or loading state per button
    setOrderingIds(prev => new Set(prev).add(product.id));

    createOrder.mutate({
        vendorId: product.vendorId,
        items: [{
            productId: product.id,
            quantity: 1
        }]
    }, {
        onSettled: () => {
             setOrderingIds(prev => {
                const next = new Set(prev);
                next.delete(product.id);
                return next;
             });
        }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No food found nearby 😔
        </h2>
        <p className="text-gray-500">
          Try checking back later for more street food!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-6 pb-24">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pasar Kaget 🏮</h1>
            <p className="text-gray-500 text-sm">What do you want to eat today?</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 w-full bg-gray-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span className="text-4xl">🍲</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-200 p-0.5">
                         {/* Vendor Avatar */}
                         {product.vendor.avatarUrl && (
                          <Image 
                              src={product.vendor.avatarUrl} 
                              alt={product.vendor.name || "Vendor"} 
                              fill 
                              className="object-cover"
                          />
                         )}
                      </div>
                      <span className="text-sm text-gray-600 truncate max-w-[150px]">
                        {product.vendor.name}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(product.price)}
                  </span>
                </div>

                <button 
                  onClick={() => handleBuy(product)}
                  disabled={orderingIds.has(product.id)}
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>{orderingIds.has(product.id) ? "Adding..." : "Order Now"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <FloatingOrderButton />
    </>
  );
}
