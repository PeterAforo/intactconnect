"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Invoice {
  id: string; invoiceNumber: string; total: number;
  amountPaid: number; status: string; createdAt: string;
  client: { name: string; email: string | null } | null;
  items: { id: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700",
  confirmed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/dashboard/invoices").then(r => r.json()).then(setInvoices).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Invoices</h1>
          <p className="text-text-muted text-sm">{invoices.length} invoices</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Create Invoice</Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["all", "draft", "sent", "confirmed", "paid", "overdue", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${filter === s ? "bg-primary text-white" : "bg-white border border-border text-text-muted hover:bg-surface"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">No invoices found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, i) => (
            <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
