"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState("");

  const utils = trpc.useUtils();

  // Mutations
  const updateProfile = trpc.users.updateBusinessProfile.useMutation();
  const createProduct = trpc.products.create.useMutation();
  
  // Check onboarding status
  const { data: profile, isLoading: isProfileLoading } = trpc.users.getProfile.useQuery();

  if (!isProfileLoading && profile && profile.isOnboarded) {
      router.push("/seller/dashboard");
  }


  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile.mutateAsync({
        businessName,
        businessDescription,
      });
      setStep(2);
    } catch (error) {
      alert("Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };



  // Local state for added products in this session to show immediate feedback
  // Ideally we query them, but for smooth UX we can just append to a list or rely on invalidation.
  // Let's rely on invalidate to be truthful.
  const { data: myProducts, refetch: refetchProducts } = trpc.products.getMyProducts.useQuery();

  const handleStep2Add = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createProduct.mutateAsync({
        name: productName,
        price: Number(productPrice),
        imageUrl: productImage || undefined,
        description: "Product added during onboarding",
      });
      // Reset form
      setProductName("");
      setProductPrice("");
      setProductImage("");
      refetchProducts();
    } catch (error) {
       console.error(error);
      alert("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
      router.push("/seller/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Seller Setup 🚀</h1>
          <p className="text-muted-foreground">Get your shop ready in minutes.</p>
        </div>

        {step === 1 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
            <h2 className="text-lg font-bold mb-4">Step 1: Business Info</h2>
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. Warung Ibu Eni"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Short Description</label>
                <textarea
                  required
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="What do you sell?"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                {isLoading ? "Saving..." : "Continue"}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
                <h2 className="text-lg font-bold mb-4">Step 2: Add Products</h2>
                <form onSubmit={handleStep2Add} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Product Name</label>
                    <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="e.g. Nasi Goreng Spesial"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Price (IDR)</label>
                    <input
                    type="number"
                    required
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="e.g. 25000"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Image URL (Optional)</label>
                    <input
                    type="text"
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="https://..."
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-secondary text-secondary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity border border-border"
                >
                    {isLoading ? "Adding..." : "+ Add Product"}
                </button>
                </form>
            </div>

            {/* Added Products List */}
            {myProducts && myProducts.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
                    <h3 className="font-bold mb-2">Added Products ({myProducts.length})</h3>
                    <ul className="space-y-2 mb-4">
                        {myProducts.map((p) => (
                            <li key={p.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <span>{p.name}</span>
                                <span className="font-mono text-muted-foreground">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(p.price)}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleFinish}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Finish Setup 🚀
                    </button>
                </div>
            )}
          </div>
        )}
        
        <div className="mt-8 flex justify-center gap-2">
            <div className={`h-2 w-2 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`h-2 w-2 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
        </div>
      </div>
    </div>
  );
}
