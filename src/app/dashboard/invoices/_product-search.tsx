"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductResult {
  id: string; name: string; sku: string | null; price: number;
  resellerPrice: number; image: string | null; category: string;
}

const fmt = (n: number) => `GH\u20B5${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

export default function ProductSearch({ onSelect }: { onSelect: (p: ProductResult) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout | number | undefined>(undefined);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard/products?search=${encodeURIComponent(term)}`);
      if (r.ok) setResults(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleChange = (val: string) => {
    setQ(val); setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 300);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <Input value={q} onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (q) setOpen(true); }}
          placeholder="Search products to add..." className="pl-8 text-sm" />
      </div>
      {open && q.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-text-muted" /></div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-text-muted text-xs">No products found</div>
          ) : results.map(p => (
            <button key={p.id} type="button"
              className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-sm border-b border-border last:border-0"
              onClick={() => { onSelect(p); setQ(""); setOpen(false); }}>
              {p.image ? (
                <img src={p.image} alt="" className="w-8 h-8 rounded object-contain bg-surface shrink-0" />
              ) : (
                <Package className="w-8 h-8 text-text-muted p-1.5 bg-surface rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-text font-medium truncate text-xs">{p.name}</p>
                <p className="text-text-muted text-[10px]">{p.category}{p.sku ? ` · SKU: ${p.sku}` : ""}</p>
              </div>
              <span className="text-primary font-bold text-xs shrink-0">{fmt(p.resellerPrice)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
