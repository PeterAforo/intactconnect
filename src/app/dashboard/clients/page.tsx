"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Phone, Mail, MapPin, Building2, Search, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Client } from "./_types";
import ClientDetail from "./_detail";
import AddClientModal from "./_form";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<Client | null>(null);
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | "individual" | "company">("all");

  const load = () => {
    fetch("/api/dashboard/clients").then(r => r.json()).then(setClients).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c => {
    if (filterType !== "all" && c.clientType !== filterType) return false;
    if (q) {
      const s = q.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.phone?.includes(s) || c.companyName?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Clients</h1>
          <p className="text-text-muted text-sm">{clients.length} total</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Client</Button>
      </div>

      {/* Search & Filter */}
      {clients.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search clients..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            {(["all", "individual", "company"] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === t ? "bg-primary text-white" : "bg-white border border-border text-text-muted hover:text-text"}`}>
                {t === "all" ? "All" : t === "individual" ? "Individual" : "Company"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Users className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">{q ? "No clients match your search" : "No clients yet. Add your first client."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setDetail(c)}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${c.clientType === "company" ? "bg-blue-100 text-blue-700" : "bg-primary/10 text-primary"}`}>
                {c.clientType === "company" ? <Building2 className="w-5 h-5" /> : c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text text-sm truncate">{c.name}</p>
                  <Badge className={`text-[10px] ${c.clientType === "company" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{c.clientType}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                  {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.city}{c.region ? `, ${c.region}` : ""}</span>}
                </div>
              </div>
              <div className="text-right text-xs text-text-muted shrink-0">
                <p className="flex items-center gap-1 justify-end"><ShoppingCart className="w-3 h-3" /> {c._count.orders}</p>
                <p className="flex items-center gap-1 justify-end"><FileText className="w-3 h-3" /> {c._count.invoices}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Slide-over */}
      {detail && <ClientDetail client={detail} onClose={() => setDetail(null)} />}

      {/* Add Client Modal */}
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}
