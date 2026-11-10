"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, Package, Loader2, Share2, Copy, Check, MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function formatPrice(n: number) {
  return `GH₵${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Any[]>([]);
  const [categories, setCategories] = useState<Any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");
  const [shareProduct, setShareProduct] = useState<Any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setStoreSlug(d.reseller?.storeSlug || "");
    }).catch(() => {});
    fetch("/api/dashboard/onboarding").then((r) => r.json()).then((d) => {
      const flat = [
        ...(d.categories || []).filter((c: Any) => !c.parentId),
        ...(d.categories || []).flatMap((c: Any) => (c.children || []).map((ch: Any) => ({ ...ch, _parentName: c.name }))),
      ];
      setCategories(flat);
    }).catch(() => {});
  }, []);

  const fetchProducts = async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    params.set("page", String(pageNum));
    params.set("limit", "24");
    try {
      const res = await fetch(`/api/dashboard/products?${params}`);
      const d = await res.json();
      setProducts((prev) => (append ? [...prev, ...(d.products || [])] : d.products || []));
      if (d.pagination) {
        setPage(d.pagination.page);
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
      }
    } catch { /* ignore */ }
    if (pageNum === 1) setLoading(false); else setLoadingMore(false);
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchProducts(1, false), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const productUrl = (p: Any) => `https://www.intactconnect.com.gh/store/${storeSlug}/product/${p.slug}`;

  const copyLink = (p: Any) => {
    navigator.clipboard?.writeText(productUrl(p));
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const whatsappUrl = (p: Any) => {
    const text = encodeURIComponent(`Check out ${p.name} on my store — ${formatPrice(p.resellerPrice)}\n${productUrl(p)}`);
    return `https://wa.me/?text=${text}`;
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Catalog</h1>
        <p className="text-text-muted text-sm">Every product with your exact commission — share any product and earn the margin.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or SKU..." className="pl-9 rounded-lg bg-white" />
        </div>
        <div className="relative sm:w-64">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full appearance-none bg-white border border-border rounded-lg pl-3 pr-8 py-2.5 text-sm text-text">
            <option value="">All categories</option>
            {categories.map((c: Any) => (
              <option key={c.id} value={c.id}>{c._parentName ? `${c._parentName} → ${c.name}` : c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      <p className="text-xs text-text-muted mb-4 tabular-nums">{total.toLocaleString()} products</p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-3">
              <div className="aspect-square rounded-lg mb-2 bg-surface animate-pulse" />
              <div className="h-3.5 w-3/4 mb-2 bg-surface rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-surface rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Package className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">No products match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group flex flex-col">
              <div className="relative aspect-square bg-surface">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="220px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><Package className="w-8 h-8 text-border" /></div>
                )}
                {p.marginPercent > 0 && (
                  <span className="absolute top-2 left-2 bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-md">+{p.marginPercent}%</span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-[11px] text-text-muted truncate">{p.category}</p>
                <p className="text-xs font-semibold text-text line-clamp-2 min-h-[2rem]">{p.name}</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-sm font-bold text-primary tabular-nums">{formatPrice(p.resellerPrice)}</span>
                </div>
                <p className="text-[11px] font-semibold text-success tabular-nums">You earn {formatPrice(p.commissionPerUnit)}/unit</p>
                <button
                  onClick={() => setShareProduct(p)}
                  className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg py-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {page < totalPages && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => fetchProducts(page + 1, true)} disabled={loadingMore} className="rounded-lg">
            {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...</> : `Load more (${total - products.length} left)`}
          </Button>
        </div>
      )}

      {/* Share sheet */}
      {shareProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShareProduct(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-surface overflow-hidden relative shrink-0">
                {shareProduct.image ? <Image src={shareProduct.image} alt="" fill className="object-cover" /> : <Package className="w-6 h-6 text-border absolute inset-0 m-auto" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text line-clamp-2">{shareProduct.name}</p>
                <p className="text-xs text-success font-semibold">Earn {formatPrice(shareProduct.commissionPerUnit)} per sale</p>
              </div>
              <button onClick={() => setShareProduct(null)} className="p-1.5 text-text-muted hover:text-text">✕</button>
            </div>
            <div className="bg-surface rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
              <p className="text-xs text-text-muted font-mono truncate flex-1">{productUrl(shareProduct)}</p>
              <button onClick={() => copyLink(shareProduct)} className="text-primary shrink-0">
                {copiedId === shareProduct.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={whatsappUrl(shareProduct)} target="_blank" rel="noopener noreferrer">
                <Button className="w-full rounded-lg bg-[#25D366] hover:bg-[#1fb757] text-white gap-2">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
              </a>
              <Button variant="outline" onClick={() => copyLink(shareProduct)} className="w-full rounded-lg gap-2">
                {copiedId === shareProduct.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
