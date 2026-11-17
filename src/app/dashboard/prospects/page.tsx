"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, MapPin, Upload, UserPlus, Phone, Mail, Globe, ChevronRight,
  MessageCircle, Loader2, Filter, X, Sparkles, Download,
} from "lucide-react";
import { formatPrice as _fp } from "@/lib/utils";
void _fp;

interface Prospect {
  id: string; name: string; type: string; category: string | null;
  phone: string | null; email: string | null; website: string | null;
  address: string | null; area: string | null; status: string; score: number;
  source: string | null; createdAt: string;
  activities: { type: string; createdAt: string }[];
}
interface SearchResult {
  sourceId: string; name: string; type: string; category: string | null;
  phone: string | null; email: string | null; website: string | null;
  address: string | null; area: string | null; latitude: number; longitude: number;
  score: number;
}

const STATUSES = ["new", "contacted", "interested", "negotiating", "converted", "lost"];
const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#eef2fa] text-[#3f5f8a]",
  contacted: "bg-[#faf3e4] text-amber-700",
  interested: "bg-violet-50 text-violet-700",
  negotiating: "bg-sky-50 text-sky-700",
  converted: "bg-emerald-50 text-emerald-700",
  lost: "bg-red-50 text-red-600",
};
const CATEGORIES = [
  { value: "all", label: "All businesses" },
  { value: "shop", label: "Shops & retail" },
  { value: "restaurant", label: "Food & restaurants" },
  { value: "electronics", label: "Electronics & phones" },
  { value: "salon", label: "Salons & fitness" },
  { value: "office", label: "Offices & services" },
  { value: "school", label: "Schools" },
  { value: "healthcare", label: "Health" },
  { value: "hotel", label: "Hotels & lodging" },
  { value: "auto", label: "Auto & fuel" },
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [due, setDue] = useState(false);
  const [followUpsDue, setFollowUpsDue] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Search panel
  const [searchOpen, setSearchOpen] = useState(false);
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("all");
  const [radius, setRadius] = useState(3);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [resultArea, setResultArea] = useState("");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (due) params.set("due", "1");
    const res = await fetch(`/api/dashboard/prospects?${params}`);
    const d = await res.json();
    setProspects(d.prospects || []);
    setByStatus(d.byStatus || {});
    setTotal(d.total || 0);
    setFollowUpsDue(d.followUpsDue || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [status, due]); // eslint-disable-line react-hooks/exhaustive-deps

  const runSearch = async () => {
    if (!area.trim()) return;
    setSearching(true); setResults(null); setPicked(new Set()); setNotice("");
    try {
      const res = await fetch("/api/dashboard/prospects/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: area.trim(), category: category === "all" ? null : category, radiusKm: radius }),
      });
      const d = await res.json();
      if (!res.ok) { setNotice(d.error || "Search failed"); return; }
      setResults(d.results || []);
      setResultArea(d.area || area);
      // pre-check results that have phone or email
      setPicked(new Set((d.results || []).map((_: unknown, i: number) => i).filter((i: number) => {
        const r = (d.results as SearchResult[])[i];
        return r.phone || r.email;
      })));
    } catch { setNotice("Search failed — check your connection"); }
    setSearching(false);
  };

  const importSelected = async () => {
    if (!results) return;
    setImporting(true);
    const payload = [...picked].map((i) => ({
      ...results[i], source: "osm", area: resultArea,
    }));
    const res = await fetch("/api/dashboard/prospects/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospects: payload }),
    });
    const d = await res.json();
    setNotice(`Imported ${d.created ?? 0} prospects${d.skipped ? `, skipped ${d.skipped} duplicates` : ""}`);
    setImporting(false);
    load();
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { setNotice("CSV needs a header row + data rows"); return; }
    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const idx = (n: string) => header.indexOf(n);
    const prospects = lines.slice(1).map((line) => {
      // simple CSV parse (no quoted commas)
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        name: cols[idx("name")] || cols[0],
        phone: cols[idx("phone")] ?? cols[idx("phone number")] ?? null,
        email: cols[idx("email")] ?? null,
        area: cols[idx("area")] ?? cols[idx("city")] ?? null,
        category: cols[idx("category")] ?? null,
        address: cols[idx("address")] ?? null,
        notes: cols[idx("notes")] ?? null,
        source: "csv",
      };
    }).filter((p) => p.name);
    if (!prospects.length) { setNotice("No valid rows found"); return; }
    const res = await fetch("/api/dashboard/prospects/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospects }),
    });
    const d = await res.json();
    setNotice(`Imported ${d.created ?? 0} prospects${d.skipped ? `, skipped ${d.skipped}` : ""}`);
    load();
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const bulkStatus = async (s: string) => {
    await Promise.all([...selected].map((id) =>
      fetch(`/api/dashboard/prospects/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      })
    ));
    setSelected(new Set()); load();
  };

  const exportCsv = () => {
    const rows = [["name", "type", "category", "phone", "email", "area", "status", "score", "source"],
      ...prospects.map((p) => [p.name, p.type, p.category || "", p.phone || "", p.email || "", p.area || "", p.status, p.score, p.source || ""])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "prospects.csv"; a.click();
  };

  const stats = useMemo(() => [
    { label: "Total", value: total, color: "text-[#1c1917]" },
    { label: "New", value: byStatus.new || 0, color: "text-[#3f5f8a]" },
    { label: "Contacted", value: byStatus.contacted || 0, color: "text-amber-700" },
    { label: "Interested", value: (byStatus.interested || 0) + (byStatus.negotiating || 0), color: "text-violet-700" },
    { label: "Converted", value: byStatus.converted || 0, color: "text-emerald-700" },
  ], [total, byStatus]);

  return (
    <div className="px-5 sm:px-7 py-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.05] flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[#1c1917]">Prospects</h1>
          <p className="text-[13px] text-[#8a857c] mt-0.5">Find businesses, win them as clients.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="h-9 px-3.5 rounded-full bg-[#f0efec] hover:bg-[#e6e4df] text-[13px] font-medium text-[#3a362f] inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
          <button onClick={() => setSearchOpen((v) => !v)} className="h-9 px-4 rounded-full bg-[#0d0b09] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#2a251d] transition-colors">
            <MapPin className="w-3.5 h-3.5" /> {searchOpen ? "Close search" : "Find businesses"}
          </button>
        </div>
      </div>

      {notice && <div className="mt-4 bg-[#eef2fa] border border-[#d7e0f2] text-[#3f5f8a] rounded-xl px-4 py-2.5 text-[13px]">{notice}</div>}

      {/* Area search panel */}
      {searchOpen && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-white rounded-xl border border-black/[0.06] p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Area / neighbourhood</label>
              <input value={area} onChange={(e) => setArea(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="e.g. Osu, Accra or Kumasi" className="w-full h-10 px-3 rounded-lg border border-[#e2e0da] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 px-3 rounded-lg border border-[#e2e0da] text-[13px] bg-white">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Radius: {radius}km</label>
              <input type="range" min={1} max={15} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-28 accent-[#0d0b09]" />
            </div>
            <button onClick={runSearch} disabled={searching || !area.trim()} className="h-10 px-5 rounded-lg bg-[#0d0b09] text-white text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-50">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
            </button>
          </div>
          <p className="text-[11px] text-[#a8a29a] mt-3">Searches OpenStreetMap for real businesses in the area. Results with phone or email are pre-selected.</p>

          {results && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold text-[#1c1917]">{results.length} businesses found near {resultArea}</p>
                <button onClick={importSelected} disabled={importing || picked.size === 0} className="h-9 px-4 rounded-full bg-[#0d0b09] text-white text-[12px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Import {picked.size} selected
                </button>
              </div>
              {results.length === 0 ? (
                <p className="text-[13px] text-[#8a857c] py-6 text-center">No businesses found in this area — try a wider radius or different category.</p>
              ) : (
                <div className="border border-black/[0.06] rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
                  {results.map((r, i) => (
                    <label key={i} className={`flex items-center gap-3 px-3 py-2.5 border-b border-black/[0.04] last:border-0 cursor-pointer hover:bg-[#faf9f7] ${picked.has(i) ? "bg-[#faf9f7]" : ""}`}>
                      <input type="checkbox" checked={picked.has(i)} onChange={() => setPicked((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })} className="accent-[#0d0b09]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-[#1c1917] truncate">{r.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.score >= 7 ? "bg-emerald-50 text-emerald-700" : r.score >= 4 ? "bg-[#faf3e4] text-amber-700" : "bg-[#f0efec] text-[#6b665e]"}`}>score {r.score}</span>
                        </div>
                        <p className="text-[11px] text-[#8a857c] truncate">{[r.category, r.area].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {r.phone && <span title={r.phone} className="text-[#3f5f8a]"><Phone className="w-3.5 h-3.5" /></span>}
                        {r.email && <span title={r.email} className="text-emerald-700"><Mail className="w-3.5 h-3.5" /></span>}
                        {r.website && <span title={r.website} className="text-violet-600"><Globe className="w-3.5 h-3.5" /></span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-black/[0.05] px-4 py-3">
            <p className={`text-[20px] font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-[#8a857c] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline tabs + search */}
      <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {followUpsDue > 0 && (
            <button onClick={() => setDue((v) => !v)} className={`h-8 px-3 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${due ? "bg-amber-500 text-white" : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"}`}>
              Follow-ups due ({followUpsDue})
            </button>
          )}
          {["all", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`h-8 px-3 rounded-full text-[12px] font-medium whitespace-nowrap capitalize transition-colors ${status === s ? "bg-[#0d0b09] text-white" : "bg-white border border-black/[0.07] text-[#6b665e] hover:text-[#1c1917]"}`}>
              {s}{s !== "all" && byStatus[s] ? ` (${byStatus[s]})` : ""}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a8a29a]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email..." className="h-9 pl-8 pr-3 w-56 rounded-full border border-black/[0.08] bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15" />
          </div>
          <button onClick={exportCsv} className="h-9 w-9 rounded-full bg-white border border-black/[0.08] flex items-center justify-center text-[#6b665e] hover:text-[#1c1917]" title="Export CSV" aria-label="Export CSV">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="mt-3 flex items-center gap-2 bg-[#0d0b09] text-white rounded-xl px-4 py-2.5 text-[12px]">
          <span className="font-semibold">{selected.size} selected</span>
          <select onChange={(e) => { if (e.target.value) { bulkStatus(e.target.value); e.target.value = ""; } }} className="h-7 px-2 rounded-md bg-white/10 text-white text-[12px] border-0">
            <option value="">Set status…</option>
            {STATUSES.map((s) => <option key={s} value={s} className="text-[#1c1917]">{s}</option>)}
          </select>
          <Link href={`/dashboard/campaigns/new?prospects=${[...selected].join(",")}`} className="h-7 px-3 rounded-md bg-white text-[#0d0b09] font-semibold flex items-center">
            Add to campaign
          </Link>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 bg-white rounded-xl border border-black/[0.05] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-[#f5f4f1] rounded-lg animate-pulse" />)}</div>
        ) : prospects.length === 0 ? (
          <div className="p-14 text-center">
            <Sparkles className="w-9 h-9 text-[#d6d3d1] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[#1c1917]">No prospects yet</p>
            <p className="text-[13px] text-[#8a857c] mt-1 mb-4">Search an area to find businesses, or import your own list.</p>
            <button onClick={() => setSearchOpen(true)} className="h-9 px-4 rounded-full bg-[#0d0b09] text-white text-[12px] font-semibold">Find businesses</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead>
                <tr className="border-b border-black/[0.05] text-[11px] uppercase tracking-wide text-[#a8a29a]">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-3 py-3 font-medium">Prospect</th>
                  <th className="px-3 py-3 font-medium">Contact</th>
                  <th className="px-3 py-3 font-medium">Area</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <tr key={p.id} className="border-b border-black/[0.03] last:border-0 hover:bg-[#faf9f7] transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-[#0d0b09]" aria-label={`Select ${p.name}`} />
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/dashboard/prospects/${p.id}`} className="group">
                        <p className="text-[13px] font-semibold text-[#1c1917] group-hover:underline truncate max-w-[220px]">{p.name}</p>
                        <p className="text-[11px] text-[#8a857c] capitalize">{p.type}{p.category ? ` · ${p.category}` : ""}</p>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {p.phone && <a href={`https://wa.me/${p.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-[#3f5f8a] hover:text-[#0d0b09]" title={p.phone}><Phone className="w-3.5 h-3.5" /></a>}
                        {p.email && <a href={`mailto:${p.email}`} className="text-emerald-700 hover:text-emerald-800" title={p.email}><Mail className="w-3.5 h-3.5" /></a>}
                        {p.website && <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="text-violet-600" title={p.website}><Globe className="w-3.5 h-3.5" /></a>}
                        {!p.phone && !p.email && !p.website && <span className="text-[11px] text-[#d6d3d1]">no contact</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#6b665e] max-w-[140px] truncate">{p.area || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${p.score >= 7 ? "bg-emerald-50 text-emerald-700" : p.score >= 4 ? "bg-[#faf3e4] text-amber-700" : "bg-[#f0efec] text-[#8a857c]"}`}>{p.score}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[p.status] || "bg-[#f0efec] text-[#6b665e]"}`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/dashboard/prospects/${p.id}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6b665e] hover:text-[#0d0b09]">
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
