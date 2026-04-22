"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import ProductSearch from "../_product-search";

interface Client { id: string; name: string; email: string | null; }
interface LineItem { productId: string | null; description: string; quantity: number; unitPrice: number; }

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [tax, setTax] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { fetch("/api/dashboard/clients").then(r => r.json()).then(setClients); }, []);

  const addProductItem = (p: { id: string; name: string; resellerPrice: number }) => {
    const idx = items.findIndex(i => i.productId === p.id);
    if (idx >= 0) {
      setItems(items.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setItems([...items, { productId: p.id, description: p.name, quantity: 1, unitPrice: p.resellerPrice }]);
    }
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateQty = (idx: number, qty: number) => setItems(items.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal + parseFloat(tax || "0");

  const handleCreate = async (sendNow: boolean) => {
    if (!items.length) return;
    setSaving(true);
    await fetch("/api/dashboard/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: clientId || null, items, tax: parseFloat(tax || "0"), dueDate: dueDate || null, notes: notes || null, sendNow }),
    });
    setSaving(false);
    router.push("/dashboard/invoices");
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.push("/dashboard/invoices")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Invoices
      </button>
      <h1 className="text-2xl font-bold text-text mb-6">Create Invoice</h1>

      <div className="space-y-5">
        {/* Client */}
        <div className="bg-white rounded-xl border border-border p-4">
          <label className="text-sm font-medium text-text block mb-2">Client</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
            <option value="">Select client (optional)</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ""}</option>)}
          </select>
        </div>

        {/* Product Search */}
        <div className="bg-white rounded-xl border border-border p-4">
          <label className="text-sm font-medium text-text block mb-2">Add Items from Products</label>
          <ProductSearch onSelect={addProductItem} />
        </div>

        {/* Line Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-4">
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

        {/* Tax & Due Date */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-text block mb-1">Tax (GH₵)</label><Input type="number" min="0" step="0.01" value={tax} onChange={e => setTax(e.target.value)} /></div>
            <div><label className="text-sm font-medium text-text block mb-1">Due Date</label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div className="mt-3">
            <label className="text-sm font-medium text-text block mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none" />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-text-muted">Tax</span><span>{formatPrice(parseFloat(tax || "0"))}</span></div>
          <div className="flex justify-between text-sm font-bold border-t border-border pt-2"><span>Total</span><span>{formatPrice(total)}</span></div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={() => handleCreate(false)} disabled={saving || !items.length}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Draft
          </Button>
          <Button className="flex-1 h-11" onClick={() => handleCreate(true)} disabled={saving || !items.length}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />} Send Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
