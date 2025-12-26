"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          setError(error.message);
        } else {
          setUser(user);
        }
      } catch (err) {
        setError("Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If we have an error but no user, generally we just treat it as not authenticated
  // unless it's a specific API error we want to show.
  // For this simple example, if we have no user, we show "Not authenticated".
  
  if (!user) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <h3 className="text-gray-800 font-medium">Not authenticated</h3>
        <p className="text-gray-600 text-sm mt-1">
          Please sign in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
        <button
          type="button"
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Name</span>
          <p className="text-gray-900">{user.user_metadata.name || "Not provided"}</p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">Email</span>
          <p className="text-gray-900">{user.email}</p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">User ID</span>
          <p className="text-gray-900 text-sm font-mono">{user.id}</p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">Created At</span>
          <p className="text-gray-900">
            {user.created_at
              ? new Date(user.created_at).toLocaleString()
              : "Unknown"}
          </p>
        </div>

        {user.user_metadata.avatar_url && (
          <div>
            <span className="text-sm font-medium text-gray-500">
              Profile Image
            </span>
            <div className="mt-2">
              <Image
                src={user.user_metadata.avatar_url}
                alt="Profile"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Raw User Data
        </h4>
        <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
