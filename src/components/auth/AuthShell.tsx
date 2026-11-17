"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, Smartphone, ShieldCheck, ShoppingBag, Store, Bell } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

function FloatCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className={`absolute bg-white rounded-xl shadow-2xl shadow-black/40 border border-white/10 p-3.5 ${className || ""}`}
    >
      {children}
    </motion.div>
  );
}

export default function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex bg-[#fbfbfd]">
      {/* Left — form area */}
      <div className={`flex-1 lg:flex-none flex flex-col ${wide ? "lg:w-[56%]" : "lg:w-1/2"} relative`}>
        <div className="absolute top-6 left-6 z-10">
          <Link href="/"><Image src="/img/logo.png" alt="IntactConnect" width={170} height={48} className="h-11 w-auto" /></Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16 lg:py-8">
          <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
        </div>
        <p className="text-center text-text-muted text-xs pb-5">© {new Date().getFullYear()} IntactConnect — Powered by Intact Ghana</p>
      </div>

      {/* Right — branded visual panel (Jobsly-style) */}
      <div className={`hidden lg:flex relative overflow-hidden bg-[#0d0b09] ${wide ? "lg:w-[44%]" : "lg:w-1/2"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_60%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_20%_80%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="text-3xl font-bold text-white leading-tight mb-3"
            >
              Hustle smart.<br /><span className="text-white/50">Earn more.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="text-white/60 text-sm max-w-sm leading-relaxed mb-8"
            >
              Your own storefront. Genuine Intact Ghana products. Commission on every sale — delivered for you.
            </motion.p>
            <div className="space-y-3">
              {[
                { icon: TrendingUp, text: "Transparent commission on every sale" },
                { icon: Smartphone, text: "Sell from your phone, anywhere in Ghana" },
                { icon: ShieldCheck, text: "Verified KYC keeps the marketplace safe" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASE }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white/75">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Floating mini-cards — Jobsly-style app mockups */}
          <div className="relative h-56 mt-8">
            <FloatCard delay={0} className="top-0 left-4 w-56">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#0d0b09] flex items-center justify-center"><Store className="w-4 h-4 text-white" /></div>
                <div>
                  <p className="text-[11px] font-bold text-text">Ama's Store</p>
                  <p className="text-[9px] text-text-muted">intactconnect.com.gh/store/ama</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-surface-dark overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 1.2, delay: 0.6, ease: EASE }} className="h-full bg-emerald-500 rounded-full" />
              </div>
              <p className="text-[9px] text-text-muted mt-1">78% of monthly goal</p>
            </FloatCard>

            <FloatCard delay={0.8} className="top-24 right-6 w-48">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-surface overflow-hidden relative shrink-0">
                  <Image src="/img/logo.png" alt="" fill className="object-contain p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-text truncate">iPhone 15 Pro</p>
                  <p className="text-[10px] font-bold text-emerald-600">+GH₵250 commission</p>
                </div>
              </div>
            </FloatCard>

            <FloatCard delay={1.4} className="top-2 right-2 w-52">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text">New order!</p>
                  <p className="text-[10px] text-text-muted">GH₵1,250 · paid via MoMo</p>
                </div>
              </div>
            </FloatCard>
          </div>
        </div>
      </div>
    </div>
  );
}
