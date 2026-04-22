"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, KeyRound, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SIDE_IMG = "/img/girls-walk-along-streets-city.jpg";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Invalid Reset Link</h2>
          <p className="text-text-muted text-sm mb-6">This password reset link is missing or invalid. Please request a new one.</p>
          <Link href="/forgot-password"><Button className="rounded-full px-8">Request New Link</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary">
        <Image src={SIDE_IMG} alt="Young professionals" fill sizes="50vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Link href="/"><Image src="/img/logo.png" alt="IntactConnect" width={200} height={56} className="h-14 w-auto brightness-0 invert" /></Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4 leading-tight">Create New Password</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Choose a strong password to keep your account and earnings safe.
            </p>
            <div className="space-y-3">
              {[
                { icon: Lock, text: "Minimum 8 characters" },
                { icon: ShieldCheck, text: "Keep your account secure" },
                { icon: KeyRound, text: "One-time use reset link" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Powered by Intact Ghana</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
              {success ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-text mb-2">Password Reset!</h2>
                  <p className="text-text-muted text-sm mb-6">
                    Your password has been successfully updated. You can now sign in with your new password.
                  </p>
                  <Link href="/login">
                    <Button className="w-full rounded-full h-11">Sign In Now</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-text mb-1">Set New Password</h1>
                    <p className="text-text-muted text-sm">Choose a strong password for your account</p>
                  </div>

                  {error && <div className="bg-danger/10 text-danger rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">New Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="pr-10"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Confirm Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      Reset Password
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
