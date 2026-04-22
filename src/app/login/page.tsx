"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, TrendingUp, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LOGIN_IMG = "/img/african-american-business-woman-with-laptop.jpg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Image Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary">
        <Image src={LOGIN_IMG} alt="Young professional" fill sizes="50vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Link href="/"><Image src="/img/logo.png" alt="IntactConnect" width={200} height={56} className="h-14 w-auto brightness-0 invert" /></Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4 leading-tight">Welcome Back, Boss.</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Your dashboard is waiting. Check your orders, track commissions, and keep the hustle going.
            </p>
            <div className="space-y-3">
              {[
                { icon: TrendingUp, text: "Track your earnings in real-time" },
                { icon: Smartphone, text: "Manage orders from your phone" },
                { icon: ShieldCheck, text: "Secure & trusted platform" },
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

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
              <div className="text-center mb-6">
                <Image src="/img/logo.png" alt="IntactConnect" width={200} height={56} className="h-14 w-auto mx-auto mb-1" />
                <p className="text-text-muted text-sm">Sign in to your reseller dashboard</p>
              </div>

              {error && <div className="bg-danger/10 text-danger rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text block mb-1">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1">Password</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>

              <div className="text-center mt-4">
                <Link href="/forgot-password" className="text-primary hover:underline text-sm">Forgot your password?</Link>
              </div>

              <p className="text-center text-text-muted text-sm mt-4">
                Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline font-medium">Register</Link>
              </p>
            </div>

            {/* Mobile-only feature highlights */}
            <div className="lg:hidden mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, label: "Track Earnings" },
                { icon: Smartphone, label: "Mobile Friendly" },
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
