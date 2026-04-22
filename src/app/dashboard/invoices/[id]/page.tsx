"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, Pencil, Trash2, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface InvoiceItem { id: string; description: string; quantity: number; unitPrice: number; total: number; }
interface Invoice {
  id: string; invoiceNumber: string; subtotal: number; tax: number; total: number;
  amountPaid: number; status: string; dueDate: string | null; notes: string | null;
  sentAt: string | null; createdAt: string;
  client: { id: string; name: string; email: string | null } | null; items: InvoiceItem[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700",
  confirmed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/invoices/${id}`).then(r => r.json()).then(setInv).finally(() => setLoading(false));
  }, [id]);

  const canEdit = inv && !["paid", "confirmed"].includes(inv.status);
  const canDelete = inv && !["paid", "confirmed", "sent"].includes(inv.status) && (inv.amountPaid || 0) === 0;

  const handleDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/dashboard/invoices/${id}`, { method: "DELETE" });
    if (r.ok) router.push("/dashboard/invoices");
    else { const d = await r.json(); alert(d.error || "Cannot delete"); setDeleting(false); setShowConfirm(false); }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!inv) return <div className="p-8 text-center text-text-muted">Invoice not found</div>;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.push("/dashboard/invoices")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Invoices
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text font-mono">{inv.invoiceNumber}</h1>
            <Badge className={`text-xs ${STATUS_COLORS[inv.status] || ""}`}>{inv.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/invoices/${id}/edit`)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Meta */}
        <div className="bg-white rounded-xl border border-border p-4 grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-text-muted block text-xs mb-0.5">Client</span>
            <span className="text-text font-medium flex items-center gap-1"><User className="w-3.5 h-3.5" /> {inv.client?.name || "No client"}</span>
          </div>
          <div><span className="text-text-muted block text-xs mb-0.5">Created</span>
            <span className="text-text font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(inv.createdAt).toLocaleDateString()}</span>
          </div>
          {inv.dueDate && (
            <div><span className="text-text-muted block text-xs mb-0.5">Due Date</span>
              <span className="text-text font-medium">{new Date(inv.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {inv.sentAt && (
            <div><span className="text-text-muted block text-xs mb-0.5">Sent</span>
              <span className="text-text font-medium">{new Date(inv.sentAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Description</th>
                <th className="text-center px-2 py-2.5 text-xs font-medium text-text-muted w-16">Qty</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted w-24">Price</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map(item => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-text">{item.description}</td>
                  <td className="px-2 py-2.5 text-center text-text-muted">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-text-muted">{formatPrice(item.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-text">{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span>{formatPrice(inv.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-text-muted">Tax</span><span>{formatPrice(inv.tax)}</span></div>
          <div className="flex justify-between text-sm font-bold border-t border-border pt-2"><span>Total</span><span>{formatPrice(inv.total)}</span></div>
          {inv.amountPaid > 0 && (
            <div className="flex justify-between text-sm text-success"><span>Paid</span><span>{formatPrice(inv.amountPaid)}</span></div>
          )}
        </div>

        {inv.notes && (
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase mb-1">Notes</h3>
            <p className="text-sm text-text">{inv.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 p-6 w-[360px]">
            <h3 className="font-bold text-text mb-2">Delete Invoice?</h3>
            <p className="text-sm text-text-muted mb-4">This action cannot be undone. Delete invoice <strong>{inv.invoiceNumber}</strong>?</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
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
