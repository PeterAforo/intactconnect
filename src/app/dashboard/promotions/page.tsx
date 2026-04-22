"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, X, Loader2, Calendar, Percent, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Promo {
  id: string; title: string; description: string | null; image: string | null;
  discount: number | null; code: string | null; startDate: string; endDate: string;
  active: boolean; createdAt: string;
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", discount: "", code: "", startDate: "", endDate: "" });

  const load = () => { fetch("/api/dashboard/promotions").then(r => r.json()).then(setPromos).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) return;
    setSaving(true);
    await fetch("/api/dashboard/promotions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false); setShowAdd(false);
    setForm({ title: "", description: "", discount: "", code: "", startDate: "", endDate: "" });
    load();
  };

  const isActive = (p: Promo) => p.active && new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date();

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Promotions</h1>
          <p className="text-text-muted text-sm">Create promotions that appear on your store page</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Promotion</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Megaphone className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">No promotions yet. Create one to attract customers.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {promos.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive(p) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text text-sm">{p.title}</p>
                  <Badge className={`text-[10px] ${isActive(p) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {isActive(p) ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                  {p.discount && <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> {p.discount}% off</span>}
                  {p.code && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {p.code}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Promotion Modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[480px] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="font-bold text-text text-lg">New Promotion</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1">Title *</label>
                <Input value={form.title} onChange={e => sf("title", e.target.value)} placeholder="e.g. Weekend Flash Sale" required />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1">Description</label>
                <textarea value={form.description} onChange={e => sf("description", e.target.value)} rows={2}
                  placeholder="Details about the promotion..." className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text block mb-1">Discount %</label>
                  <Input type="number" min="0" max="100" value={form.discount} onChange={e => sf("discount", e.target.value)} placeholder="e.g. 10" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1">Promo Code</label>
                  <Input value={form.code} onChange={e => sf("code", e.target.value.toUpperCase())} placeholder="e.g. SAVE10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text block mb-1">Start Date *</label>
                  <Input type="date" value={form.startDate} onChange={e => sf("startDate", e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1">End Date *</label>
                  <Input type="date" value={form.endDate} onChange={e => sf("endDate", e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full h-11" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />} Create Promotion
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
