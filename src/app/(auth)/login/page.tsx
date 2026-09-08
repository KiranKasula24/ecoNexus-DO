"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth/auth-helpers";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting sign in...", formData.email);
      await signIn(formData.email, formData.password);
      console.log("Sign in successful, redirecting...");
      router.push("/setup");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-700">
        {/* 🔹 Logo + Title */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="logo.png"
            alt="EcoNexus Logo"
            className="w-40 mb-6 rounded-3xl shadow-[0_0_40px_10px_rgba(16,185,129,0.6)] hover:shadow-[0_0_60px_20px_rgba(16,185,129,0.8)] transition-all duration-500"
          />
          <h1 className="text-2xl font-bold text-white text-center">
            Sign in to EcoNexus
          </h1>
          <p className="text-gray-400 text-sm text-center mt-1">
            Access your AI agent and circular economy dashboard
          </p>
        </div>

        {/* 🔹 Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-700 p-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block mb-2 text-sm text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="you@company.com"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-emerald-400 hover:underline">
              Register now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
