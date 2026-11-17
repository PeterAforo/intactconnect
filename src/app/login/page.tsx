"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const EASE = [0.16, 1, 0.3, 1] as const;

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-[#e2e0da] bg-white text-sm text-[#1c1917] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15 focus:border-[#0d0b09]/40 transition";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    setResendStatus("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      setResendStatus("Verification email sent! Check your inbox.");
    } catch (err) {
      setResendStatus(err instanceof Error ? err.message : "Failed to resend");
    }
    setResending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);
    setResendStatus("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          setError(data.error || "Please verify your email first");
        } else {
          throw new Error(data.error || "Login failed");
        }
        return;
      }
      if (data.needsResellerSignup) {
        router.push("/become-reseller");
        return;
      }
      if (data.pendingReview) {
        router.push("/pending");
        return;
      }
      if (data.user.role === "admin" || data.user.role === "super_admin") {
        router.push("/admin");
      } else if (data.user.reseller && data.user.reseller.onboardingComplete === false) {
        router.push("/dashboard/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
    setLoading(false);
  };

  return (
    <AuthShell switchHref="/register" switchLabel="Sign up">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h1 className="text-[22px] font-bold text-[#1c1917] tracking-tight leading-snug">Sign in to IntactConnect</h1>
        <p className="text-[13px] text-[#6b665e] mt-1 mb-6">Welcome back — your store is waiting.</p>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-4 text-[13px]">
            {error}
          </div>
        )}
        {needsVerification && (
          <div className="bg-[#f5f4f1] border border-[#e2e0da] rounded-lg px-3 py-2.5 mb-4 text-[13px]">
            <p className="text-[#6b665e] mb-1.5">Didn&apos;t receive the email? Check your spam folder.</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-[#1c1917] font-medium hover:underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendStatus && <p className="mt-1.5 text-[#6b665e] text-xs">{resendStatus}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="email" className="text-[13px] font-medium text-[#1c1917] block mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29a] pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="text-[13px] font-medium text-[#1c1917] block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29a] pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`${inputCls} pl-9 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29a] hover:text-[#1c1917] transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-center -mt-1">
            <Link href="/forgot-password" className="text-[13px] text-[#6b665e] hover:text-[#1c1917] hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-[#0d0b09] text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2a251d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log in"}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#a8a29a] mt-5 leading-relaxed">
          Shop on intactghana.com? Sign in — we&apos;ll set you up as a reseller.
        </p>
      </motion.div>
    </AuthShell>
  );
}
