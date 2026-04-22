"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, X, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import ProductSearch from "./_product-search";

interface InvoiceItem { id: string; description: string; quantity: number; unitPrice: number; total: number; }
interface Invoice {
  id: string; invoiceNumber: string; subtotal: number; tax: number; total: number;
  amountPaid: number; status: string; dueDate: string | null; notes: string | null;
  sentAt: string | null; createdAt: string;
  client: { name: string; email: string | null } | null; items: InvoiceItem[];
}
interface Client { id: string; name: string; email: string | null; }
interface LineItem { productId: string | null; description: string; quantity: number; unitPrice: number; }

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [tax, setTax] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    const [invRes, clRes] = await Promise.all([fetch("/api/dashboard/invoices"), fetch("/api/dashboard/clients")]);
    setInvoices(await invRes.json());
    setClients(await clRes.json());
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const addProductItem = (p: { id: string; name: string; resellerPrice: number }) => {
    const idx = items.findIndex(i => i.productId === p.id);
    if (idx >= 0) {
      setItems(items.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setItems([...items, { productId: p.id, description: p.name, quantity: 1, unitPrice: p.resellerPrice }]);
    }
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateQty = (idx: number, qty: number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal + parseFloat(tax || "0");

  const handleCreate = async (sendNow: boolean) => {
    if (!items.length) return;
    setSaving(true);
    await fetch("/api/dashboard/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: clientId || null, items, tax: parseFloat(tax || "0"), dueDate: dueDate || null, notes: notes || null, sendNow }),
    });
    setSaving(false); setShowCreate(false);
    setItems([]); setClientId(""); setTax("0"); setDueDate(""); setNotes("");
    fetchData();
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Invoices</h1>
          <p className="text-text-muted text-sm">{invoices.length} invoices</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Create Invoice</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">No invoices yet. Create one for your clients.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-text text-sm">{inv.invoiceNumber}</p>
                <p className="text-xs text-text-muted">
                  {inv.client?.name || "No client"} &bull; {inv.items.length} item{inv.items.length !== 1 ? "s" : ""} &bull; {new Date(inv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-text text-sm">{formatPrice(inv.total)}</p>
                <Badge className={`text-xs ${STATUS_COLORS[inv.status] || ""}`}>{inv.status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[620px] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="font-bold text-text text-lg">Create Invoice</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Client */}
              <div>
                <label className="text-sm font-medium text-text block mb-1">Client</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                  <option value="">Select client (optional)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ""}</option>)}
                </select>
              </div>

              {/* Product Search */}
              <div>
                <label className="text-sm font-medium text-text block mb-1">Add Items from Products</label>
                <ProductSearch onSelect={addProductItem} />
              </div>

              {/* Line Items Table */}
              {items.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-text block mb-2">Invoice Items</label>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-medium text-text-muted">Product</th>
                          <th className="text-center px-2 py-2 text-xs font-medium text-text-muted w-20">Qty</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-text-muted w-24">Price</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-text-muted w-24">Total</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="border-t border-border">
                            <td className="px-3 py-2 text-text">{item.description}</td>
                            <td className="px-2 py-1 text-center">
                              <input type="number" min="1" value={item.quantity}
                                onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 rounded border border-border text-center text-sm mx-auto block" />
                            </td>
                            <td className="px-3 py-2 text-right text-text-muted">{formatPrice(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-right font-medium text-text">{formatPrice(item.quantity * item.unitPrice)}</td>
                            <td className="px-2 py-2">
                              <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-text block mb-1">Tax (GH₵)</label><Input type="number" min="0" step="0.01" value={tax} onChange={e => setTax(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-text block mb-1">Due Date</label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              </div>

              <div><label className="text-sm font-medium text-text block mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none" /></div>

              {/* Summary */}
              <div className="bg-surface rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Tax</span><span>{formatPrice(parseFloat(tax || "0"))}</span></div>
                <div className="flex justify-between text-sm font-bold border-t border-border pt-1"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleCreate(false)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Draft
                </Button>
                <Button className="flex-1" onClick={() => handleCreate(true)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />} Send Invoice
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
