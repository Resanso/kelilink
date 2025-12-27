"use client";

import { trpc } from "@/lib/trpc/client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function PaymentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data: order, isLoading } = trpc.orders.getOrderById.useQuery({ orderId: id });
  const payMutation = trpc.orders.payOrder.useMutation({
    onSuccess: () => {
      router.push(`/tracking/${id}`);
    },
    onError: (err) => {
      alert("Payment failed: " + err.message);
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="bg-card w-full max-w-sm rounded-3xl shadow-xl overflow-hidden border border-border/50">
        {/* Header */}
        <div className="bg-primary p-8 text-primary-foreground text-center">
          <h1 className="text-2xl font-bold mb-1">Payment</h1>
          <p className="opacity-90 text-sm">Complete your payment to start delivery</p>
        </div>

        {/* Order Summary */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground text-sm uppercase tracking-wide font-medium mb-2">Total Amount</p>
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(order.totalPrice)}
            </h2>
          </div>

          <div className="border-t border-border/50 pt-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                 <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex gap-2">
                        <span className="font-semibold text-foreground">{item.quantity}x</span>
                        <span className="text-muted-foreground">{item.productName}</span>
                    </div>
                    <span className="font-medium text-foreground">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(item.priceAtOrder * item.quantity)}
                    </span>
                 </div>
              ))}
            </div>
          </div>
          
          {/* Vendor Info */}
          <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border border-border/50">
             <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted border border-border">
                {order.vendor.avatarUrl ? (
                    <Image src={order.vendor.avatarUrl} alt="Vendor" fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                )}
             </div>
             <div>
                <p className="text-sm font-semibold text-foreground">{order.vendor.name}</p>
                <p className="text-xs text-muted-foreground">Vendor</p>
             </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => payMutation.mutate({ orderId: id })}
            disabled={payMutation.isPending}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
          >
            {payMutation.isPending ? "Processing..." : "Saya Sudah Bayar 💸"}
          </button>
        </div>
      </div>
    </div>
  );
}
