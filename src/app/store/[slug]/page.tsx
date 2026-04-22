"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Filter, ChevronDown, Star, Phone, Mail, Store as StoreIcon, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StoreData {
  id: string; storeName: string; storeSlug: string; bio: string | null; picture: string; phone: string; email: string;
}

interface ProductItem {
  id: string; name: string; slug: string; price: number; comparePrice: number | null;
  resellerPrice: number; originalPrice: number; image: string | null;
  category: { id: string; name: string; slug: string }; rating: number; reviewCount: number; stock: number;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "name", label: "Name A-Z" },
];

export default function StorePage() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [cart, setCart] = useState<{ id: string; name: string; price: number; image: string | null; qty: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("sort", sort);
    params.set("page", page.toString());

    const res = await fetch(`/api/store/${slug}/products?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setProducts(data.products);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [slug, search, sort, page]);

  useEffect(() => {
    fetch(`/api/store/${slug}`).then((r) => {
      if (!r.ok) { setNotFound(true); setLoading(false); return; }
      return r.json();
    }).then((d) => { if (d) setStore(d); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    if (store) fetchProducts();
  }, [store, fetchProducts]);

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: product.id, name: product.name, price: product.resellerPrice, image: product.image, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  };
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const formatPrice = (p: number) => `GH₵${p.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 text-center">
        <StoreIcon className="w-16 h-16 text-text-muted mb-4" />
        <h1 className="text-2xl font-bold text-text mb-2">Store Not Found</h1>
        <p className="text-text-muted mb-4">This store doesn&apos;t exist or hasn&apos;t been approved yet.</p>
        <a href="/" className="text-primary hover:underline">Go to IntactConnect</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Store Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={store!.picture} alt={store!.storeName} className="w-10 h-10 rounded-full object-cover border border-border" />
            <div>
              <h1 className="font-bold text-text text-lg leading-tight">{store!.storeName}</h1>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {store!.phone}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {store!.email}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowCart(true)} className="relative p-2 rounded-lg hover:bg-surface transition-colors">
            <ShoppingCart className="w-5 h-5 text-text" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Store Bio */}
      {store!.bio && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-text-muted text-sm">{store!.bio}</p>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-sm">{total} products</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-border overflow-hidden group"
              >
                <div className="aspect-square relative bg-surface">
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                  {product.comparePrice && product.comparePrice > product.resellerPrice && (
                    <Badge className="absolute top-2 left-2 bg-danger text-white text-xs">
                      -{Math.round((1 - product.resellerPrice / product.comparePrice) * 100)}%
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-text-muted mb-1">{product.category.name}</p>
                  <h3 className="text-sm font-medium text-text line-clamp-2 mb-2 leading-tight">{product.name}</h3>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 fill-warning text-warning" />
                      <span className="text-xs text-text-muted">{product.rating.toFixed(1)} ({product.reviewCount})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text text-sm">{formatPrice(product.resellerPrice)}</p>
                      {product.comparePrice && product.comparePrice > product.resellerPrice && (
                        <p className="text-xs text-text-muted line-through">{formatPrice(product.comparePrice)}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addToCart(product)}>
                      Add
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="flex items-center text-sm text-text-muted">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Cart Slide-over */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-text text-lg">Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="text-text-muted hover:text-text">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-text-muted text-center py-8">Your cart is empty</p>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-surface rounded-lg p-3">
                  {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-contain bg-white" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.name}</p>
                    <p className="text-sm text-primary font-bold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded bg-white border border-border text-sm">-</button>
                    <span className="w-7 text-center text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded bg-white border border-border text-sm">+</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-text">Total</span>
                  <span className="font-bold text-text text-lg">{formatPrice(cartTotal)}</span>
                </div>
                <Button
                  className="w-full rounded-full h-11"
                  onClick={() => {
                    const cartData = encodeURIComponent(JSON.stringify(cart));
                    router.push(`/store/${slug}/checkout?cart=${cartData}`);
                    setShowCart(false);
                  }}
                >
                  Checkout ({formatPrice(cartTotal)})
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="text-text-muted text-xs">
          Powered by <a href="/" className="text-primary hover:underline font-medium">IntactConnect</a> &mdash; {store!.storeName}
        </p>
      </footer>
    </div>
  );
}
