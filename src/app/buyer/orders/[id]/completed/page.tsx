"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

export default function OrderCompletedPage() {
    const { id } = useParams() as { id: string };
    const { data: order, isLoading } = trpc.orders.getOrderById.useQuery({ orderId: id });
    
    if (isLoading) return <div className="text-center p-8">Loading summary...</div>;
    if (!order) return <div className="text-center p-8 text-red-500">Order not found</div>;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-green-500"></div>
                
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Delivered!</h1>
                    <p className="text-gray-500 mt-2">Enjoy your food from <span className="font-semibold text-gray-800">{order.vendor.name}</span></p>
                </div>

                 {/* Vendor Avatar */}
                 <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md">
                     {order.vendor.avatarUrl ? (
                         <Image src={order.vendor.avatarUrl} alt="Vendor" fill className="object-cover" />
                     ) : (
                         <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                     )}
                 </div>

                {/* Stars (Dummy Rating) */}
                <div className="flex justify-center gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map(i => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 cursor-pointer hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                <p className="text-xs text-gray-400">Rate your experience</p>

                <Link
                    href="/buyer/dashboard"
                    className="block w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
