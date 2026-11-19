"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Star, ShoppingCart, Package, Minus, Plus, ChevronLeft, ChevronRight, Truck, ShieldCheck, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreReviewsSection from "@/components/store/StoreReviewsSection";

interface ProductImage { id: string; url: string; alt: string | null; }
interface Review { id: string; rating: number; comment: string | null; createdAt: string; user: { name: string | null }; }
interface RelatedProduct { id: string; name: string; slug: string; price: number; resellerPrice: number; comparePrice: number | null; image: string | null; rating: number; reviewCount: number; category: { name: string }; }
interface ResellerInfo {
  id: string; storeName: string; storeSlug: string; picture: string; storeLogo: string | null; storeBanner: string | null;
  phone: string; email: string; bio: string | null; storeTagline: string | null; storeThemeColor: string | null;
}
interface Product {
  id: string; name: string; slug: string; description: string; price: number; resellerPrice: number;
  image: string | null;
  comparePrice: number | null; sku: string | null; stock: number; rating: number; reviewCount: number; specs: string | null;
  images: ProductImage[]; category: { id: string; name: string; slug: string };
  brand: { id: string; name: string } | null; reviews: Review[]; related: RelatedProduct[];
  frequentlyBought?: RelatedProduct[];
  reseller: ResellerInfo;
}

const fmt = (n: number) => `GH\u20B5${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

export default function ProductDetailPage() {
  const { slug, productSlug } = useParams() as { slug: string; productSlug: string };
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const atcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/store/${slug}/products/${productSlug}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(d => { if (d) { setProduct(d); setLoading(false); } });
  }, [slug, productSlug]);

  // Sticky mobile buy bar once the main CTA scrolls away
  useEffect(() => {
    const el = atcRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [product]);

  // Lock scroll + keyboard nav while zoom is open
  useEffect(() => {
    document.body.style.overflow = zoomOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [zoomOpen]);
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const n = product?.images.length || 1;
      if (e.key === "Escape") setZoomOpen(false);
      if (e.key === "ArrowRight") setSelectedImg((i) => (i + 1) % n);
      if (e.key === "ArrowLeft") setSelectedImg((i) => (i - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, product]);

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-surface"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (notFound || !product) return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface text-center px-4">
      <Package className="w-16 h-16 text-text-muted mb-4" />
      <h1 className="text-2xl font-bold text-text mb-2">Product Not Found</h1>
      <Link href={`/store/${slug}`} className="text-primary hover:underline">Back to Store</Link>
    </div>
  );

  const discount = product.comparePrice && product.comparePrice > product.resellerPrice
    ? Math.round((1 - product.resellerPrice / product.comparePrice) * 100) : 0;
  const reseller = product.reseller;
  const accent = reseller.storeThemeColor || "#17140f";

  const buyNow = () => {
    const item = { id: product.id, name: product.name, price: product.resellerPrice, image: product.image, qty };
    router.push(`/store/${slug}/checkout?cart=${encodeURIComponent(JSON.stringify([item]))}`);
  };

  return (
    <div className="min-h-dvh bg-surface">
      {/* Store Header / Navbar */}
      <header className="bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/store/${slug}`}>
              <img src={reseller.storeLogo || reseller.picture} alt={reseller.storeName} className="w-10 h-10 rounded-full object-cover border border-border" />
            </Link>
            <div>
              <h1 className="font-bold text-text text-lg leading-tight">{reseller.storeName}</h1>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">{reseller.phone}</span>
                <span className="flex items-center gap-1">{reseller.email}</span>
              </div>
            </div>
          </div>
          <Link href={`/store/${slug}`} className="flex items-center gap-1.5 text-text-muted hover:text-text text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href={`/store/${slug}`} className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to {reseller.storeName}
        </Link>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative">
              <button
                onClick={() => setZoomOpen(true)}
                className="bg-white rounded-2xl border border-border overflow-hidden aspect-square relative block w-full cursor-zoom-in"
                aria-label="Zoom product image"
              >
                {product.images.length > 0 ? (
                  <Image src={product.images[selectedImg].url} alt={product.images[selectedImg].alt || product.name}
                    fill className="object-contain p-4" sizes="(max-width:1024px) 100vw, 50vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-text-muted" /></div>
                )}
                {discount > 0 && <Badge className="absolute top-3 left-3 bg-danger text-white pointer-events-none">-{discount}%</Badge>}
              </button>
              {product.images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImg(i => (i - 1 + product.images.length) % product.images.length)}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center z-10"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedImg(i => (i + 1) % product.images.length)}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center z-10"><ChevronRight className="w-4 h-4" /></button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 ${i === selectedImg ? "border-primary" : "border-border"}`}>
                    <Image src={img.url} alt="" width={64} height={64} className="object-contain w-full h-full p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-text-muted mb-1">{product.category.name}{product.brand ? ` · ${product.brand.name}` : ""}</p>
            <h1 className="text-2xl font-bold text-text mb-3">{product.name}</h1>

            {product.rating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />)}</div>
                <span className="text-sm text-text-muted">{product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-primary">{fmt(product.resellerPrice)}</span>
              {discount > 0 && product.comparePrice && <span className="text-lg text-text-muted line-through">{fmt(product.comparePrice)}</span>}
            </div>

            {product.stock < 10 && <p className="text-sm text-warning mb-3">Only {product.stock} left in stock</p>}

            {/* Quantity + Buy */}
            <div ref={atcRef} className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-surface" aria-label="Decrease quantity"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-surface" aria-label="Increase quantity"><Plus className="w-4 h-4" /></button>
              </div>
              <Button className="flex-1 h-11 rounded-full text-white" style={{ backgroundColor: accent }} onClick={buyNow}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Buy Now — {fmt(product.resellerPrice * qty)}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[{ icon: Truck, text: "Fast Delivery" }, { icon: ShieldCheck, text: "Genuine Product" }, { icon: RotateCcw, text: "Easy Returns" }].map((b, i) => (
                <div key={i} className="bg-surface rounded-lg p-3 text-center">
                  <b.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-text-muted font-medium">{b.text}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-border p-4 mb-4">
              <h3 className="font-semibold text-text mb-2">Description</h3>
              <div className="text-sm text-text-muted leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>

            {/* Specs */}
            {product.specs && (
              <div className="bg-white rounded-xl border border-border p-4 mb-4">
                <h3 className="font-semibold text-text mb-2">Specifications</h3>
                <div className="text-sm text-text-muted prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.specs }} />
              </div>
            )}

            {product.sku && <p className="text-xs text-text-muted">SKU: {product.sku}</p>}
          </div>
        </div>

        {/* Reviews */}
        <StoreReviewsSection
          storeSlug={slug}
          productSlug={productSlug}
          productRating={product.rating}
          reviewCount={product.reviewCount}
        />

        {/* Frequently bought together — real order co-occurrence for this store */}
        {product.frequentlyBought && product.frequentlyBought.length > 0 && (
          <div className="mt-10 pb-8">
            <h2 className="text-xl font-bold text-text mb-1">Frequently bought together</h2>
            <p className="text-sm text-text-muted mb-4">Customers who bought this also picked up these.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {product.frequentlyBought.map((p, i) => (
                <Link key={p.id} href={`/store/${slug}/product/${p.slug}`}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl border border-border overflow-hidden group hover:border-primary/30">
                    <div className="aspect-square relative bg-surface">
                      {p.image ? <Image src={p.image} alt={p.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" sizes="25vw" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-text-muted" /></div>}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-text line-clamp-2 mb-1">{p.name}</h3>
                      <p className="font-bold text-sm" style={{ color: accent }}>{fmt(p.resellerPrice)}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {product.related.length > 0 && (
          <div className="mt-10 pb-8">
            <h2 className="text-xl font-bold text-text mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {product.related.map((p, i) => (
                <Link key={p.id} href={`/store/${slug}/product/${p.slug}`}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl border border-border overflow-hidden group hover:border-primary/30">
                    <div className="aspect-square relative bg-surface">
                      {p.image ? <Image src={p.image} alt={p.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" sizes="25vw" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-text-muted" /></div>}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-text-muted mb-1">{p.category.name}</p>
                      <h3 className="text-sm font-medium text-text line-clamp-2 mb-1">{p.name}</h3>
                      <p className="font-bold text-primary text-sm">{fmt(p.resellerPrice)}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-[#f5f4f1] py-6 text-center">
        <p className="text-text-muted text-xs">Powered by <a href="/" className="text-primary hover:underline font-medium">IntactConnect</a></p>
      </footer>

      {/* Zoom lightbox */}
      {zoomOpen && product.images.length > 0 && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4" onClick={() => setZoomOpen(false)} role="dialog" aria-modal="true" aria-label="Product image viewer">
          <button className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/25 rounded-full p-2" onClick={() => setZoomOpen(false)} aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          {product.images.length > 1 && (
            <>
              <button aria-label="Previous image"
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setSelectedImg((i) => (i - 1 + product.images.length) % product.images.length); }}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button aria-label="Next image"
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setSelectedImg((i) => (i + 1) % product.images.length); }}>
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <Image
            src={product.images[selectedImg].url}
            alt={product.images[selectedImg].alt || product.name}
            width={1200}
            height={1200}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {product.images.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{selectedImg + 1} / {product.images.length}</p>
          )}
        </div>
      )}

      {/* Sticky mobile buy bar */}
      {showSticky && product.stock > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white shadow-[0_-12px_32px_rgba(0,0,0,0.12)] px-4 py-3 flex items-center gap-3">{/* taste-skill-ignore: sticky bar is a real overlay */}
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold" style={{ color: accent }}>{fmt(product.resellerPrice * qty)}</p>
          </div>
          <Button className="flex-1 h-11 rounded-full text-white" style={{ backgroundColor: accent }} onClick={buyNow}>
            <ShoppingCart className="w-4 h-4 mr-2" /> Buy Now
          </Button>
        </div>
      )}
    </div>
  );
}
