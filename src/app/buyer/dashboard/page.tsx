"use client";

import { trpc } from "@/lib/trpc/client";
import Image from "next/image";
import { useState } from "react";
import { FloatingOrderButton } from "@/components/buyer/floating-order-button";
import { LogoutButton } from "@/components/auth/logout-button";
import { WeatherWidget } from "@/components/weather/weather-widget";

import dynamic from "next/dynamic";

const ActiveDriversMap = dynamic(() => import("@/components/map/ActiveDriversMap"), {
    ssr: false,
    loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">Loading Map...</div>
});

export default function BuyerDashboard() {
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.getAvailable.useQuery();
  const { data: activeDrivers } = trpc.users.getActiveSellers.useQuery();

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products?.filter((product) => {
    const term = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) || 
      product.vendor.name?.toLowerCase().includes(term)
    );
  });

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
      <div className="p-4 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pb-24">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 animate-pulse">
            <div className="h-52 bg-muted rounded-xl mb-4"></div>
            <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show "No products found" if search result is empty BUT products existed initially
  const showEmptySearch = products && products.length > 0 && filteredProducts?.length === 0;

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
             <span className="text-2xl">🍽️</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          No food found nearby
        </h2>
        <p className="text-muted-foreground max-w-xs">
          Passer Kaget vendors haven't opened their stalls yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="flex flex-col gap-4 pt-2">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</span>
                    <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                         <span className="text-lg font-bold text-foreground">Telkom University, Bandung</span>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {/* Profile Avatar Trigger (Static for now) */}
                <div className="flex items-center gap-2">
                    <WeatherWidget />
                    <LogoutButton />
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-none rounded-2xl leading-5 bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-shadow"
                    placeholder="Search for bakso, mie ayam..."
                />
            </div>
        </div>
        
        {/* Nearby Drivers Map */}
        <div className="w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-sm border border-border/50 relative shrink-0">
             <ActiveDriversMap drivers={activeDrivers || []} />
             
             {/* Map Overlay Info */}
             <div className="absolute w-[15vw] bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/50 z-[1000] flex items-center justify-between">
                 <div>
                    <p className="font-bold text-gray-900 text-sm">{activeDrivers?.length || 0} Drivers Nearby</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Live Updates</p>
                 </div>
                 <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_0_4px_rgba(34,197,94,0.2)]"></div>
             </div>
        </div>

        {/* Product List */}
        {showEmptySearch ? (
                <div className="text-center py-20">
                    <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl grayscale opacity-50">🔍</span>
                    </div>
                    <h3 className="text-foreground text-lg font-bold mb-2">No results found</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Try searching for something else like "Bakso" or "Mie Ayam".
                    </p>
                    <button 
                        onClick={() => setSearchQuery("")}
                        className="mt-6 text-primary font-semibold text-sm hover:underline"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts?.map((product) => (
                    <div
                    key={product.id}
                    className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden hover:shadow-md transition-shadow group"
                    >
    
                <div className="relative h-56 w-full bg-muted">
                    {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/30">
                        <span className="text-5xl">🍲</span>
                    </div>
                    )}
                    {/* Vendor Chip */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 shadow-sm border border-white/50">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted">
                            {product.vendor.avatarUrl && (
                            <Image 
                                src={product.vendor.avatarUrl} 
                                alt={product.vendor.name || "Vendor"} 
                                fill 
                                className="object-cover"
                            />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                             <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
                                 {product.vendor.name}
                             </span>
                             {product.vendor.phoneNumber && (
                                <a 
                                  href={`https://wa.me/${product.vendor.phoneNumber.replace(/^0/, '62')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-green-600 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                    <span>📞 Chat</span>
                                </a>
                             )}
                        </div>
                    </div>
                </div>
                
                <div className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                    <h3 className="font-bold text-foreground text-xl leading-snug">{product.name}</h3>
                    <span className="font-bold text-lg text-primary bg-primary/5 px-2 py-1 rounded-lg">
                        {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        }).format(product.price)}
                    </span>
                    </div>
    
                    <div className="mt-auto">
                    <button 
                        onClick={() => handleBuy(product)}
                        disabled={orderingIds.has(product.id)}
                        className="h-12 w-full bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                    >
                        <span>{orderingIds.has(product.id) ? "Adding..." : "Order Now"}</span>
                    </button>
                    </div>
                </div>
                </div>
                ))}
                </div>
            )
        }
      </div>
      
      <FloatingOrderButton />
    </>
  );
}
