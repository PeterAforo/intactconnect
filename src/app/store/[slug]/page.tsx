"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search, ShoppingCart, Star, Phone, Mail, Store as StoreIcon, Package, Tag,
  Percent, ChevronRight, X, ShieldCheck, Truck, MessageCircle, ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubCategoryItem { id: string; name: string; slug: string; image: string | null; }
interface CategoryItem { id: string; name: string; slug: string; image: string | null; _count: { products: number }; children: SubCategoryItem[]; }
interface Promotion { id: string; title: string; description: string | null; image: string | null; discount: number | null; code: string | null; }
interface StoreData {
  id: string; storeName: string; storeSlug: string; bio: string | null; picture: string; phone: string; email: string;
  storeLogo: string | null; storeBanner: string | null; storeTagline: string | null; storeThemeColor: string | null;
  categories: CategoryItem[]; promotions: Promotion[];
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
  const gridRef = useRef<HTMLDivElement>(null);

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [cart, setCart] = useState<{ id: string; name: string; price: number; image: string | null; qty: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [flyoutCategory, setFlyoutCategory] = useState<string | null>(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const accent = store?.storeThemeColor || "#17140f";

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeCategory) params.set("category", activeCategory);
    params.set("sort", sort);
    params.set("page", page.toString());

    const res = await fetch(`/api/store/${slug}/products?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setProducts(data.products);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [slug, search, sort, page, activeCategory]);

  useEffect(() => {
    fetch(`/api/store/${slug}`).then((r) => {
      if (!r.ok) { setNotFound(true); setLoading(false); return; }
      return r.json();
    }).then((d) => { if (d) setStore(d); setLoading(false); });
  }, [slug]);

  // Fire-and-forget view tracking (deduped per session)
  useEffect(() => {
    try {
      let key = sessionStorage.getItem("ic_track_key");
      if (!key) { key = crypto.randomUUID(); sessionStorage.setItem("ic_track_key", key); }
      if (!sessionStorage.getItem(`ic_tracked_${slug}`)) {
        sessionStorage.setItem(`ic_tracked_${slug}`, "1");
        fetch(`/api/store/${slug}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "store_view", sessionKey: key }),
        }).catch(() => {});
      }
    } catch { /* tracking is non-critical */ }
  }, [slug]);

  useEffect(() => {
    if (store) fetchProducts();
  }, [store, fetchProducts]);

  // Best sellers shelf — most-reviewed products, independent of grid filters
  useEffect(() => {
    if (!store) return;
    fetch(`/api/store/${slug}/products?sort=popular&page=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.products) setBestSellers(d.products.slice(0, 8)); })
      .catch(() => {});
  }, [store, slug]);

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: product.id, name: product.name, price: product.resellerPrice, image: product.image, qty: 1 }];
    });
    setShowCart(true);
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  };
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const formatPrice = (p: number) => `GH₵${p.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
  const waLink = `https://wa.me/${(store?.phone || "").replace(/\D/g, "")}`;

  const chooseCategory = (id: string | null) => {
    setActiveCategory(id);
    setPage(1);
    setFlyoutCategory(null);
    setMobileCategoriesOpen(false);
    setMobileExpanded(null);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeCategoryName = (() => {
    if (!activeCategory || !store?.categories) return null;
    for (const parent of store.categories) {
      if (parent.id === activeCategory) return parent.name;
      const sub = parent.children.find((c) => c.id === activeCategory);
      if (sub) return sub.name;
    }
    return null;
  })();

  const allCategories = store?.categories.flatMap((c) => [c, ...c.children]) || [];

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#f5f5f4]">
        <div className="w-8 h-8 border-4 border-[#17140f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#f5f5f4] px-4 text-center">
        <StoreIcon className="w-16 h-16 text-[#a8a29a] mb-4" />
        <h1 className="text-2xl font-bold text-[#1c1917] mb-2">Store Not Found</h1>
        <p className="text-[#6b665e] mb-4">This store doesn&apos;t exist or hasn&apos;t been approved yet.</p>
        <a href="/" className="text-[#17140f] hover:underline">Go to IntactConnect</a>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-[#1c1917]">
      {/* Slim sticky header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href={`/store/${slug}`} className="flex items-center gap-3 min-w-0">
            <img src={store!.storeLogo || store!.picture} alt={store!.storeName} className="w-9 h-9 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="font-bold text-[15px] leading-tight truncate">{store!.storeName}</p>
              {store!.storeTagline && <p className="text-[12px] text-[#8a857c] truncate hidden sm:block">{store!.storeTagline}</p>}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {store!.phone && (
              <a href={waLink} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-medium text-[#6b665e] hover:bg-black/[0.04] transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            <button onClick={() => setShowCart(true)} aria-label="Open cart"
              className="relative w-10 h-10 rounded-full bg-[#f5f5f4] hover:bg-[#eceae5] flex items-center justify-center transition-colors">
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#17140f] text-white rounded-full text-[11px] flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero — the store itself is the window */}
      {store!.storeBanner ? (
        <section className="relative h-[62svh] min-h-[420px] w-full overflow-hidden" aria-label={`${store!.storeName} storefront`}>
          <Image src={store!.storeBanner} alt={`${store!.storeName} banner`} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10">{/* taste-skill-ignore: neutral scrim over photo for text legibility */}</div>
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[0.98]">{store!.storeName}</h1>
              {store!.storeTagline && <p className="mt-3 text-base sm:text-lg text-white/80 max-w-xl">{store!.storeTagline}</p>}
              <a href="#collection" className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent }}>
                Shop the collection <ArrowDown className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#f5f5f4] px-5 sm:px-8 py-20 sm:py-28" aria-label={`${store!.storeName} storefront`}>
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <img src={store!.storeLogo || store!.picture} alt="" className="w-16 h-16 rounded-full object-cover" />
              <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#8a857c]">Official store on IntactConnect</p>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#111] leading-[0.95] max-w-4xl">{store!.storeName}</h1>
            {store!.storeTagline && <p className="mt-5 text-lg sm:text-xl text-[#6b665e] max-w-xl">{store!.storeTagline}</p>}
            <a href="#collection" className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-full text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}>
              Shop the collection <ArrowDown className="w-4 h-4" />
            </a>
          </div>
        </section>
      )}

      {/* Trust bar */}
      <section className="bg-white" aria-label="Store assurances">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Genuine products", sub: "Sourced from Intact Ghana" },
            { icon: Truck, title: "Nationwide delivery", sub: "To your door across Ghana" },
            { icon: ShoppingCart, title: "Secure checkout", sub: "Mobile money & cards via Hubtel" },
            { icon: MessageCircle, title: "WhatsApp support", sub: store!.phone || "Chat with the seller" },
          ].map((f, i) => (
            <div key={f.title} className={`flex items-center gap-3 py-5 ${i > 0 ? "lg:pl-6" : ""} ${i % 2 === 1 ? "pl-5 lg:pl-6" : ""}`}>
              <f.icon className="w-5 h-5 shrink-0" style={{ color: accent }} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1c1917] leading-tight">{f.title}</p>
                <p className="text-[12px] text-[#8a857c] truncate">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Departments — category tiles */}
      {allCategories.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-14 sm:py-20" aria-label="Shop by category">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111]">Departments</h2>
              <p className="mt-2 text-[15px] text-[#6b665e]">Browse by what you need.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {allCategories.slice(0, 8).map((cat) => (
              <button key={cat.id} onClick={() => chooseCategory(cat.id)}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f5f5f4] text-left transition-transform hover:-translate-y-0.5">
                {cat.image ? (
                  <Image src={cat.image} alt={cat.name} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <Tag className="w-8 h-8 text-[#c9c4ba]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent">{/* taste-skill-ignore: neutral scrim over photo for text legibility */}</div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-[15px] leading-tight">{cat.name}</p>
                  <p className="text-white/70 text-[12px] mt-0.5">{(() => { const n = (cat as CategoryItem)._count?.products; return n !== undefined ? `${n} ${n === 1 ? "item" : "items"}` : ""; })()}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Best sellers — horizontal shelf */}
      {bestSellers.length > 0 && (
        <section className="bg-[#f5f5f4] py-14 sm:py-20" aria-label="Best sellers">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111]">Best sellers</h2>
                <p className="mt-2 text-[15px] text-[#6b665e]">What customers keep coming back for.</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 snap-x">
              {bestSellers.map((p) => (
                <div key={p.id} className="snap-start shrink-0 w-[220px] sm:w-[240px] bg-white rounded-2xl overflow-hidden group">
                  <Link href={`/store/${slug}/product/${p.slug}`} className="block">
                    <div className="relative aspect-square bg-white">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill sizes="240px" className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-[#d6d3d1]" /></div>
                      )}
                      {p.comparePrice && p.comparePrice > p.resellerPrice && (
                        <Badge className="absolute top-2 left-2 bg-[#b42318] text-white text-[11px]">
                          -{Math.round((1 - p.resellerPrice / p.comparePrice) * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 pt-2">
                      <h3 className="text-[14px] font-semibold text-[#1c1917] line-clamp-2 leading-snug min-h-[2.4em]">{p.name}</h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-[15px] font-bold" style={{ color: accent }}>{formatPrice(p.resellerPrice)}</span>
                        {p.comparePrice && p.comparePrice > p.resellerPrice && (
                          <span className="text-[12px] text-[#a8a29a] line-through">{formatPrice(p.comparePrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <Button size="sm" variant="outline" className="w-full rounded-full h-9 text-[13px]"
                      onClick={(e) => { e.preventDefault(); addToCart(p); }}>
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Add to cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promotions — flat, no gradients */}
      {store!.promotions && store!.promotions.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-12" aria-label="Promotions">
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
            {store!.promotions.map((promo) => (
              <div key={promo.id} className="shrink-0 w-80 bg-[#111] text-white rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <Percent className="w-5 h-5 shrink-0 mt-0.5 text-white/70" />
                  <div>
                    <h3 className="font-bold text-[15px]">{promo.title}</h3>
                    {promo.description && <p className="text-white/60 text-[13px] mt-1">{promo.description}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      {promo.discount && <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-white/10">{promo.discount}% off</span>}
                      {promo.code && <span className="text-[12px] font-semibold tracking-wide px-2.5 py-1 rounded-full bg-white/10">Code: {promo.code}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Collection — browse grid */}
      <section id="collection" ref={gridRef} className="max-w-[1400px] mx-auto px-5 sm:px-8 py-14 sm:py-20 scroll-mt-20" aria-label="All products">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories sidebar */}
          {store!.categories && store!.categories.length > 0 && (
            <aside className="hidden lg:block w-60 shrink-0">
              <h3 className="font-semibold text-[#1c1917] text-[13px] mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Categories</h3>
              <div className="space-y-0.5" onMouseLeave={() => setFlyoutCategory(null)}>
                <button onClick={() => chooseCategory(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-[14px] transition-colors ${!activeCategory ? "font-semibold text-white" : "text-[#6b665e] hover:bg-black/[0.03]"}`}
                  style={!activeCategory ? { backgroundColor: accent } : undefined}>
                  All products
                </button>
                {store!.categories.map((cat) => (
                  <div key={cat.id} className="relative">
                    <button onClick={() => chooseCategory(cat.id)}
                      className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl text-[14px] transition-colors ${activeCategory === cat.id ? "font-semibold" : "text-[#6b665e] hover:bg-black/[0.03]"}`}
                      style={activeCategory === cat.id ? { backgroundColor: `${accent}14`, color: accent } : undefined}>
                      <span className="truncate">{cat.name}</span>
                      {cat.children.length > 0 && <ChevronRight className="w-4 h-4 shrink-0 text-[#a8a29a]" />}
                    </button>
                    {cat.children.length > 0 && flyoutCategory === cat.id && (
                      <div className="absolute left-full top-0 ml-2 z-50 w-60 bg-white rounded-2xl border border-black/[0.06] shadow-xl p-2">{/* taste-skill-ignore: dropdown is a real overlay */}
                        <p className="px-3 py-1.5 text-[11px] font-semibold text-[#8a857c] uppercase tracking-wide">{cat.name}</p>
                        <button onClick={() => chooseCategory(cat.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-colors ${activeCategory === cat.id ? "font-semibold" : "text-[#6b665e] hover:bg-black/[0.03]"}`}
                          style={activeCategory === cat.id ? { color: accent } : undefined}>
                          All {cat.name}
                        </button>
                        <div className="max-h-72 overflow-y-auto">
                          {cat.children.map((sub) => (
                            <button key={sub.id} onClick={() => chooseCategory(sub.id)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-colors ${activeCategory === sub.id ? "font-semibold" : "text-[#6b665e] hover:bg-black/[0.03]"}`}
                              style={activeCategory === sub.id ? { color: accent } : undefined}>
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile: category chips */}
            {store!.categories && store!.categories.length > 0 && (
              <div className="lg:hidden flex items-center gap-2 pb-4 overflow-x-auto">
                <button onClick={() => setMobileCategoriesOpen(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium text-white"
                  style={{ backgroundColor: accent }}>
                  <Tag className="w-4 h-4" /> Categories
                </button>
                {activeCategoryName ? (
                  <button onClick={() => chooseCategory(null)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] bg-black/[0.05] text-[#1c1917]">
                    {activeCategoryName} <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="shrink-0 px-3.5 py-2 rounded-full text-[13px] bg-[#f5f5f4] text-[#8a857c]">All products</span>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-5">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29a]" />
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search products…"
                  className="pl-10 h-10 rounded-full bg-[#f5f5f4] border-0"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#8a857c] text-[13px]">{total} products</span>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="h-10 rounded-full border-0 bg-[#f5f5f4] px-4 text-[13px]"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Products grid */}
            <div className="pb-8">
              {products.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-12 h-12 text-[#d6d3d1] mx-auto mb-3" />
                  <p className="text-[#8a857c]">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {products.map((product) => (
                    <div key={product.id} className="group">
                      <Link href={`/store/${slug}/product/${product.slug}`} className="block">
                        <div className="relative aspect-square bg-[#f5f5f4] rounded-2xl overflow-hidden">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-contain p-5 group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-[#d6d3d1]" />
                            </div>
                          )}
                          {product.comparePrice && product.comparePrice > product.resellerPrice && (
                            <span className="absolute top-2.5 left-2.5 bg-[#b42318] text-white text-[11px] font-bold px-2 py-1 rounded-full">
                              -{Math.round((1 - product.resellerPrice / product.comparePrice) * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="pt-3">
                          <p className="text-[12px] text-[#8a857c]">{product.category.name}</p>
                          <h3 className="text-[14px] font-medium text-[#1c1917] line-clamp-2 mt-0.5 leading-snug group-hover:text-[#111] transition-colors">{product.name}</h3>
                          {product.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                              <span className="text-[12px] text-[#8a857c]">{product.rating.toFixed(1)} ({product.reviewCount})</span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-[15px] font-bold" style={{ color: accent }}>{formatPrice(product.resellerPrice)}</span>
                            {product.comparePrice && product.comparePrice > product.resellerPrice && (
                              <span className="text-[12px] text-[#a8a29a] line-through">{formatPrice(product.comparePrice)}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-2.5 w-full h-10 rounded-full border border-black/[0.08] text-[13px] font-medium text-[#1c1917] hover:bg-black/[0.03] transition-colors"
                      >
                        Add to cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="flex items-center text-[13px] text-[#8a857c] px-2">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" className="rounded-full" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="bg-[#f5f5f4]" aria-label={`About ${store!.storeName}`}>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8a857c] mb-4">The store</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111] leading-[1.05]">{store!.storeName}</h2>
            {store!.storeTagline && <p className="mt-4 text-lg text-[#3a362f] font-medium">{store!.storeTagline}</p>}
            {store!.bio && <p className="mt-3 text-[15px] text-[#6b665e] leading-relaxed max-w-lg">{store!.bio}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#6b665e]">
              {store!.phone && (
                <a href={`tel:${store!.phone}`} className="flex items-center gap-1.5 hover:text-[#1c1917] transition-colors">
                  <Phone className="w-4 h-4" /> {store!.phone}
                </a>
              )}
              {store!.email && (
                <a href={`mailto:${store!.email}`} className="flex items-center gap-1.5 hover:text-[#1c1917] transition-colors">
                  <Mail className="w-4 h-4" /> {store!.email}
                </a>
              )}
              {store!.phone && (
                <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold hover:opacity-80 transition-opacity" style={{ color: accent }}>
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-white">
              <img src={store!.storeLogo || store!.picture} alt={store!.storeName} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-[#8a857c]">
            Powered by <a href="/" className="font-semibold text-[#1c1917] hover:underline">IntactConnect</a> — {store!.storeName}
          </p>
          <p className="text-[12px] text-[#a8a29a]">Genuine products · Secure checkout · Nationwide delivery</p>
        </div>
      </footer>

      {/* Cart Slide-over */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col">
            <div className="p-5 flex items-center justify-between">
              <h2 className="font-bold text-[#1c1917] text-lg">Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} aria-label="Close cart" className="text-[#8a857c] hover:text-[#1c1917] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 space-y-3">
              {cart.length === 0 ? (
                <p className="text-[#8a857c] text-center py-10">Your cart is empty</p>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-[#f5f5f4] rounded-xl p-3">
                  {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-contain bg-white" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1c1917] truncate">{item.name}</p>
                    <p className="text-sm font-bold" style={{ color: accent }}>{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-white text-sm" aria-label="Decrease">-</button>
                    <span className="w-7 text-center text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-white text-sm" aria-label="Increase">+</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-[#1c1917]">Total</span>
                  <span className="font-bold text-[#1c1917] text-lg">{formatPrice(cartTotal)}</span>
                </div>
                <Button
                  className="w-full rounded-full h-11 text-white"
                  style={{ backgroundColor: accent }}
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

      {/* Mobile Categories Drawer (bottom sheet) */}
      {mobileCategoriesOpen && store!.categories && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileCategoriesOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between">
              <h2 className="font-bold text-[#1c1917] text-lg flex items-center gap-2"><Tag className="w-5 h-5" /> Categories</h2>
              <button onClick={() => setMobileCategoriesOpen(false)} aria-label="Close categories" className="text-[#8a857c] hover:text-[#1c1917] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <button onClick={() => chooseCategory(null)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium mb-1 ${!activeCategory ? "text-white" : "text-[#1c1917] hover:bg-black/[0.03]"}`}
                style={!activeCategory ? { backgroundColor: accent } : undefined}>
                All products
              </button>
              {store!.categories.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center">
                    <button onClick={() => chooseCategory(cat.id)}
                      className={`flex-1 text-left px-3 py-2.5 rounded-xl text-sm ${activeCategory === cat.id ? "font-semibold" : "text-[#1c1917]"}`}
                      style={activeCategory === cat.id ? { color: accent } : undefined}>
                      {cat.name}
                    </button>
                    {cat.children.length > 0 && (
                      <button onClick={() => setMobileExpanded((prev) => (prev === cat.id ? null : cat.id))}
                        className="p-2.5 text-[#a8a29a]" aria-label={`Toggle ${cat.name} subcategories`}>
                        <ChevronRight className={`w-4 h-4 transition-transform ${mobileExpanded === cat.id ? "rotate-90" : ""}`} />
                      </button>
                    )}
                  </div>
                  {cat.children.length > 0 && mobileExpanded === cat.id && (
                    <div className="pl-3 pb-2 space-y-0.5">
                      {cat.children.map((sub) => (
                        <button key={sub.id} onClick={() => chooseCategory(sub.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeCategory === sub.id ? "font-semibold" : "text-[#6b665e] hover:bg-black/[0.03]"}`}
                          style={activeCategory === sub.id ? { color: accent } : undefined}>
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
