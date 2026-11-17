"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, KeyRound } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-[#e2e0da] bg-white text-sm text-[#1c1917] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15 focus:border-[#0d0b09]/40 transition";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <AuthShell switchHref="/login" switchLabel="Back to log in">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {sent ? (
          <div className="text-center py-2" role="status">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-[20px] font-bold text-[#1c1917] tracking-tight mb-1.5">Check your email</h1>
            <p className="text-[13px] text-[#6b665e] mb-1">We sent a reset link to:</p>
            <p className="text-[13px] font-medium text-[#1c1917] mb-3 break-all">{email}</p>
            <p className="text-[11px] text-[#a8a29a] mb-6 leading-relaxed">
              The link expires in 1 hour. Can&apos;t find it? Check your spam folder.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full h-10 rounded-lg border border-[#e2e0da] text-[13px] font-medium text-[#1c1917] hover:bg-[#f5f4f1] transition-colors"
              >
                Try a different email
              </button>
              <Link
                href="/login"
                className="block w-full h-10 rounded-lg bg-[#0d0b09] text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#2a251d] transition-colors"
              >
                Back to log in
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="w-11 h-11 bg-[#f0efec] rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5 text-[#1c1917]" />
            </div>
            <h1 className="text-[22px] font-bold text-[#1c1917] tracking-tight leading-snug">Reset your password</h1>
            <p className="text-[13px] text-[#6b665e] mt-1 mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-4 text-[13px]">
                {error}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-[#0d0b09] text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2a251d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
