"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, X, Loader2, Calendar, Percent, Tag, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Promo {
  id: string; title: string; description: string | null; image: string | null;
  discount: number | null; code: string | null; startDate: string; endDate: string;
  active: boolean; createdAt: string;
}

type FormState = { title: string; description: string; discount: string; code: string; startDate: string; endDate: string };
const blankForm = (): FormState => ({ title: "", description: "", discount: "", code: "", startDate: "", endDate: "" });

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => { fetch("/api/dashboard/promotions").then(r => r.json()).then(setPromos).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditId(null); setForm(blankForm()); setShowForm(true); };
  const openEdit = (p: Promo) => {
    setEditId(p.id);
    setForm({
      title: p.title, description: p.description || "", discount: p.discount ? String(p.discount) : "",
      code: p.code || "", startDate: p.startDate.split("T")[0], endDate: p.endDate.split("T")[0],
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) return;
    setSaving(true);
    const url = editId ? `/api/dashboard/promotions/${editId}` : "/api/dashboard/promotions";
    await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false); setShowForm(false); setEditId(null); setForm(blankForm());
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/dashboard/promotions/${deleteId}`, { method: "DELETE" });
    setDeleting(false); setDeleteId(null);
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
        <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4 mr-1" /> New Promotion</Button>
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
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-primary transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Promotion Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed inset-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[480px] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="font-bold text-text text-lg">{editId ? "Edit Promotion" : "New Promotion"}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
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
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
                {editId ? "Update Promotion" : "Create Promotion"}
              </Button>
            </form>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDeleteId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 p-6 w-[360px]">
            <h3 className="font-bold text-text mb-2">Delete Promotion?</h3>
            <p className="text-sm text-text-muted mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
