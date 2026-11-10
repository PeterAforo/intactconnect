"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Loader2, LogOut, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-md w-full text-center border border-border shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-white">
          <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Application Under Review</h1>
          <p className="text-white/70 text-sm mt-2">We&apos;re verifying your details — this usually takes under 24 hours.</p>
        </div>
        <div className="p-8">
          <div className="space-y-3 text-left mb-6">
            {[
              { done: true, label: "Account created" },
              { done: true, label: "Email verified" },
              { done: status === "rejected", label: status === "rejected" ? "Application reviewed" : "Admin review — in progress", pending: status !== "rejected" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-success text-white" : "bg-primary/10 text-primary"}`}>
                  {s.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
                </div>
                <p className={`text-sm ${s.pending ? "text-text font-medium" : "text-text-muted"}`}>{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mb-6">
            We&apos;ll email you as soon as your store is approved. Questions? Reach us anytime.
          </p>
          <div className="flex flex-col gap-2">
            <a href="https://wa.me/233543645126" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full rounded-full gap-2">
                <Phone className="w-4 h-4" /> WhatsApp Support
              </Button>
            </a>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}
              className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-danger transition-colors py-2"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
