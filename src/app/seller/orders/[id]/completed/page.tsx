"use client";

import Link from "next/link";

export default function SellerOrderCompletedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="text-5xl">🎉</span>
      </div>
      
      <h1 className="text-3xl font-extrabold text-green-800 mb-2">Kerja Bagus!</h1>
      <p className="text-green-600 mb-10 max-w-xs">Pesanan berhasil diselesaikan. Saldo Anda telah bertambah.</p>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 w-full max-w-xs mb-8">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Pendapatan Pesanan Ini</p>
          <p className="text-2xl font-bold text-green-700">+ Rp 25.000</p>
      </div>

      <Link 
        href="/seller/dashboard"
        className="w-full max-w-xs h-14 bg-green-600 text-white font-bold rounded-2xl flex items-center justify-center shadow-lg hover:bg-green-700 transition-all"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
