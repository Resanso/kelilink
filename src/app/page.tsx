"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Redirection logic based on role
        const role = user.user_metadata.role || 'buyer';
        if (role === 'seller') {
          router.replace("/dashboard"); // This will be handled by next.config redirect logic if we use it, 
                                        // or we should redirect to specific path:
                                        // Since we don't have role in session easily sync without a query sometimes,
                                        // we'll rely on metadata.
          router.replace("/dashboard"); // Wait, path is /seller/dashboard
          router.replace("/dashboard"); // actually we should use explicit paths
        } else {
            // router.replace("/buyer/dashboard");
        }
        
        // Let's do it cleaner:
        router.replace(`/${role === 'seller' ? 'seller' : 'buyer'}/dashboard`);
      }
      setLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Branding (Hidden on mobile, visible on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A2540] relative flex-col justify-center px-12 lg:px-20 text-white overflow-hidden">
        {/* Abstract Background Elements (simplified representation) */}
        <div className="absolute inset-0 opacity-10">
             <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 50 Q 50 100 100 50 T 200 50" stroke="white" strokeWidth="0.5" fill="none" />
                 <path d="M0 60 Q 50 110 100 60 T 200 60" stroke="white" strokeWidth="0.5" fill="none" />
                 <path d="M0 70 Q 50 120 100 70 T 200 70" stroke="white" strokeWidth="0.5" fill="none" />
                 {/* ... repeating patterns could go here or use a CSS background ... */}
             </svg>
             {/* Using a radical gradient for a premium feel */}
             <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-500 rounded-full blur-[120px] opacity-20"></div>
             <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-500 rounded-full blur-[120px] opacity-20"></div>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-5xl font-bold leading-tight">
            Selamat Datang di<br />Kelilink
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed opacity-90">
            Solusi cerdas untuk menemukan dan memesan makanan atau produk dari pedagang keliling di sekitar Anda. Membantu pedagang mengelola inventaris, menerima pesanan real-time, dan mengoptimalkan rute agar pelayanan lebih cepat dan terorganisir.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-white">
         <div className="w-full max-w-xl space-y-8">
             {/* Form Container */}
            <AuthForm />
         </div>
      </div>
    </div>
  );
}
