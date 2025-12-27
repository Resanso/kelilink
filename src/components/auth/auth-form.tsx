"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
            },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });

        if (error) {
          setError(error.message);
        } else {
          console.log("Sign up successful:", data);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          console.log("Sign in successful:", data);
          window.location.reload(); // Refresh to update session state
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Note: Role selection for OAuth is tricky as we can't easily pass it here
          // unless we use a custom flow or update it after signup.
          // For now, default is 'buyer' via database default.
        },
      });
    } catch (err) {
      setError("Google sign in failed");
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-left">
        <h2 className="text-5xl font-extrabold text-[#0A2540] tracking-tight mb-2">
          {isSignUp ? "SIGN UP" : "LOGIN"}
        </h2>
        <p className="text-gray-500 text-lg">
          {isSignUp
            ? "Create your account to get started"
            : "Welcome back! Please sign in to your account."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Minimum 8 characters"
          />
        </div>

        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to be a:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked={role === "buyer"}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Buyer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={role === "seller"}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Vendor</span>
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>

      <div className="relative">
      </div>

      
      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
