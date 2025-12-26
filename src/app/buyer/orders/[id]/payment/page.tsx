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
      router.push(`/buyer/orders/${id}/tracking`);
    },
    onError: (err) => {
      alert("Payment failed: " + err.message);
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-orange-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Payment</h1>
          <p className="text-orange-100">Complete your payment to start delivery</p>
        </div>

        {/* Order Summary */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-500 mb-1">Total Amount</p>
            <h2 className="text-4xl font-extrabold text-gray-900">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(order.totalPrice)}
            </h2>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                 <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.productName}</span>
                    <span className="font-medium">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(item.priceAtOrder * item.quantity)}
                    </span>
                 </div>
              ))}
            </div>
          </div>
          
          {/* Vendor Info */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
             <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                {order.vendor.avatarUrl && (
                    <Image src={order.vendor.avatarUrl} alt="Vendor" fill className="object-cover" />
                )}
             </div>
             <div>
                <p className="text-sm font-medium text-gray-900">{order.vendor.name}</p>
                <p className="text-xs text-gray-500">Vendor</p>
             </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => payMutation.mutate({ orderId: id })}
            disabled={payMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {payMutation.isPending ? "Processing..." : "Saya Sudah Bayar 💸"}
          </button>
        </div>
      </div>
    </div>
  );
}
