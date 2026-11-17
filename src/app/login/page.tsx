"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <h1 className="text-3xl font-bold text-text tracking-tight">Welcome back</h1>
        <p className="text-text-muted text-sm mt-1.5 mb-8">Sign in to continue your hustle</p>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl px-4 py-3 mb-5 text-sm flex items-start gap-2">
            <span className="flex-1">{error}</span>
          </div>
        )}
        {needsVerification && (
          <div className="bg-surface-dark/60 border border-border rounded-xl px-4 py-3 mb-5 text-sm">
            <p className="text-text-muted mb-2">Didn&apos;t receive the email? Check your spam folder.</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-text font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendStatus && <p className="mt-2 text-text-muted text-xs">{resendStatus}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-white text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15 focus:border-[#0d0b09]/40 transition"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 pl-10 pr-11 rounded-xl border border-border bg-white text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15 focus:border-[#0d0b09]/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-[#0d0b09]"
              />
              <span className="text-sm text-text-muted">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-text hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#0d0b09] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2a251d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-8">
          New to IntactConnect?{" "}
          <Link href="/register" className="font-semibold text-text hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
