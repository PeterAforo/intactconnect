"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, X, Loader2, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Client {
  id: string; name: string; email: string | null; phone: string | null; address: string | null;
  city: string | null; region: string | null; createdAt: string;
  _count: { orders: number; invoices: number };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", region: "" });
  const [saving, setSaving] = useState(false);

  const fetch_clients = () => {
    fetch("/api/dashboard/clients").then((r) => r.json()).then(setClients).finally(() => setLoading(false));
  };

  useEffect(() => { fetch_clients(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/dashboard/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ name: "", email: "", phone: "", address: "", city: "", region: "" });
    fetch_clients();
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Clients</h1>
          <p className="text-text-muted text-sm">{clients.length} total clients</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Client</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Users className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">No clients yet. Add your first client or they&apos;ll be created automatically when someone orders from your store.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text text-sm">{c.name}</p>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                  {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.city}</span>}
                </div>
              </div>
              <div className="text-right text-xs text-text-muted">
                <p>{c._count.orders} orders</p>
                <p>{c._count.invoices} invoices</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] bg-white rounded-2xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-text">Add Client</h2>
              <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name *" required />
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" />
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Region" />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Client
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
