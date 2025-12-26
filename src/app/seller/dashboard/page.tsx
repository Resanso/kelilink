import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SellerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-orange-200 rounded-lg h-96 p-4 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Dashboard</h1>
        <p className="text-gray-600">Manage your orders and products here.</p>
        <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
          Start Selling
        </button>
      </div>
    </div>
  );
}
