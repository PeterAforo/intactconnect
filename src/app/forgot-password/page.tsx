"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2, CheckCircle, KeyRound, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SIDE_IMG = "/img/software-engineer-coding-laptop-focusing-deep-learning.jpg";

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
    <div className="min-h-screen flex">
      {/* Left — Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary">
        <Image src={SIDE_IMG} alt="Professional working" fill sizes="50vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Link href="/"><Image src="/img/logo.png" alt="IntactConnect" width={200} height={56} className="h-14 w-auto brightness-0 invert" /></Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4 leading-tight">Forgot Your Password?</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              No worries — it happens to the best of us. We&apos;ll send you a link to reset it in seconds.
            </p>
            <div className="space-y-3">
              {[
                { icon: Mail, text: "Reset link sent to your email" },
                { icon: Clock, text: "Link expires in 1 hour" },
                { icon: ShieldCheck, text: "Secure one-time reset token" },
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
              {sent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-text mb-2">Check Your Email</h2>
                  <p className="text-text-muted text-sm mb-1">
                    We&apos;ve sent a password reset link to:
                  </p>
                  <p className="font-medium text-text mb-4">{email}</p>
                  <p className="text-text-muted text-xs mb-6">
                    The link will expire in 1 hour. If you don&apos;t see it, check your spam folder.
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => { setSent(false); setEmail(""); }} variant="outline" className="w-full rounded-full">
                      Try a different email
                    </Button>
                    <Link href="/login">
                      <Button className="w-full rounded-full">Back to Login</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-text mb-1">Reset Password</h1>
                    <p className="text-text-muted text-sm">Enter your email and we&apos;ll send a reset link</p>
                  </div>

                  {error && <div className="bg-danger/10 text-danger rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Email Address</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                      Send Reset Link
                    </Button>
                  </form>

                  <p className="text-center text-text-muted text-sm mt-4">
                    Remember your password? <Link href="/login" className="text-primary hover:underline font-medium">Sign In</Link>
                  </p>
                </>
              )}
            </div>

            {/* Mobile feature highlights */}
            <div className="lg:hidden mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Mail, label: "Email Reset" },
                { icon: Clock, label: "1 Hour Link" },
                { icon: ShieldCheck, label: "Secure" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-3 text-center">
                  <item.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-text-muted font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
