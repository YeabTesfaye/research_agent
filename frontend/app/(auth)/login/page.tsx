"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { storeTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      storeTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 bg-[#1a1a18] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5"/>
              <path d="M5.5 9h7M9 5.5v7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1a1a18] mb-1">Welcome back</h1>
          <p className="text-sm text-[#9b9b96]">Sign in to your Research Agent account</p>
        </div>

        <div className="bg-white border border-[#e8e8e3] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 bg-[#fdf0eb] border border-[#f5c4b3] rounded-lg">
                <p className="text-sm text-[#993c1d]">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#3a3a36] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 text-sm bg-[#f9f9f7] border border-[#e8e8e3] rounded-lg outline-none focus:border-[#1a1a18] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#3a3a36]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#6b6b66] hover:text-[#1a1a18] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm bg-[#f9f9f7] border border-[#e8e8e3] rounded-lg outline-none focus:border-[#1a1a18] focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1a1a18] text-white text-sm font-medium rounded-lg hover:bg-[#2a2a26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-[#9b9b96]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#1a1a18] font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
