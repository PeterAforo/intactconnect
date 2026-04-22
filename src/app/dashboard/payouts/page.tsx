"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Loader2, Clock, CheckCircle, XCircle, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

interface Payout {
  id: string; amount: number; method: string; accountDetails: string | null;
  status: string; adminNotes: string | null; requestedAt: string; processedAt: string | null;
}

const STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  requested: { color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  paid: { color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("momo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [payoutsRes, statsRes] = await Promise.all([
      fetch("/api/dashboard/payouts"),
      fetch("/api/dashboard/stats"),
    ]);
    const payoutsData = await payoutsRes.json();
    const statsData = await statsRes.json();
    setPayouts(payoutsData);
    setBalance(statsData.commissionBalance || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/dashboard/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSaving(false);
    setShowRequest(false);
    setAmount("");
    fetchData();
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Payouts</h1>
          <p className="text-text-muted text-sm">Request withdrawals from your commission balance</p>
        </div>
        <Button onClick={() => setShowRequest(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Request Payout</Button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white mb-6">
        <p className="text-sm text-white/70 mb-1">Available Balance</p>
        <p className="text-3xl font-bold">{loading ? "..." : formatPrice(balance)}</p>
      </div>

      {/* Payout History */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : payouts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Wallet className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">No payout requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p, i) => {
            const sc = STATUS_MAP[p.status] || STATUS_MAP.requested;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text text-sm">{formatPrice(p.amount)}</p>
                  <p className="text-xs text-text-muted capitalize">{p.method} &bull; {new Date(p.requestedAt).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${sc.color}`}>
                  {sc.icon} {p.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {showRequest && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRequest(false)} />
          <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] bg-white rounded-2xl shadow-2xl z-50 p-6">
            <h2 className="font-bold text-text text-lg mb-1">Request Payout</h2>
            <p className="text-text-muted text-sm mb-4">Available: {formatPrice(balance)}</p>
            {error && <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-sm mb-3">{error}</div>}
            <form onSubmit={handleRequest} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text block mb-1">Amount (GH₵)</label>
                <Input type="number" step="0.01" min="1" max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1">Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                  <option value="momo">Mobile Money</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Submit Request
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
