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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to Kelilink
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
