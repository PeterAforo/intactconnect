"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Loader2, LogOut, Phone } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function PendingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.replace("/login"); return; }
      if (d.reseller?.status === "approved") { router.replace("/dashboard"); return; }
      setStatus(d.reseller?.status || "pending");
      setChecked(true);
    }).catch(() => router.replace("/login"));
  }, [router]);

  if (!checked) {
    return (
      <AuthShell switchHref="/" switchLabel="Home">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-[#0d0b09]/40" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell switchHref="/" switchLabel="Home">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-[#f5f4f1] flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-[#0d0b09]" />
        </div>
        <h1 className="text-[22px] font-bold text-[#1c1917] tracking-tight mb-2">Application under review</h1>
        <p className="text-[13px] text-[#6b665e] leading-relaxed mb-7">
          We&apos;re verifying your details — this usually takes under 24 hours.
        </p>

        <div className="space-y-3 text-left mb-7">
          {[
            { done: true, label: "Account created" },
            { done: true, label: "Email verified" },
            { done: status === "rejected", label: status === "rejected" ? "Application reviewed" : "Admin review — in progress", pending: status !== "rejected" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#f5f4f1] text-[#6b665e]"}`}>
                {s.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
              </div>
              <p className={`text-[13px] ${s.pending ? "text-[#1c1917] font-medium" : "text-[#6b665e]"}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-[#6b665e] mb-6">
          We&apos;ll email you as soon as your store is approved. Questions? Reach us anytime.
        </p>

        <div className="space-y-2.5">
          <a
            href="https://wa.me/233543645126"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 rounded-lg border border-[#e2e0da] text-[13px] font-medium text-[#3a362f] hover:bg-[#f5f4f1] transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" /> WhatsApp support
          </a>
          <button
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}
            className="w-full flex items-center justify-center gap-2 text-[13px] text-[#6b665e] hover:text-red-600 transition-colors py-1.5"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </motion.div>
    </AuthShell>
  );
}
