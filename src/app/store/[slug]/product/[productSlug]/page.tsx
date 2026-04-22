"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Star, ShoppingCart, Package, Minus, Plus, ChevronLeft, ChevronRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductImage { id: string; url: string; alt: string | null; }
interface Review { id: string; rating: number; comment: string | null; createdAt: string; user: { name: string | null }; }
interface RelatedProduct { id: string; name: string; slug: string; price: number; resellerPrice: number; comparePrice: number | null; image: string | null; rating: number; reviewCount: number; category: { name: string }; }
interface Product {
  id: string; name: string; slug: string; description: string; price: number; resellerPrice: number;
  comparePrice: number | null; sku: string | null; stock: number; rating: number; reviewCount: number; specs: string | null;
  images: ProductImage[]; category: { id: string; name: string; slug: string };
  brand: { id: string; name: string } | null; reviews: Review[]; related: RelatedProduct[];
}

const fmt = (n: number) => `GH\u20B5${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

export default function ProductDetailPage() {
  const { slug, productSlug } = useParams() as { slug: string; productSlug: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetch(`/api/store/${slug}/products/${productSlug}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(d => { if (d) { setProduct(d); setLoading(false); } });
  }, [slug, productSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (notFound || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center px-4">
      <Package className="w-16 h-16 text-text-muted mb-4" />
      <h1 className="text-2xl font-bold text-text mb-2">Product Not Found</h1>
      <Link href={`/store/${slug}`} className="text-primary hover:underline">Back to Store</Link>
    </div>
  );

  const discount = product.comparePrice && product.comparePrice > product.resellerPrice
    ? Math.round((1 - product.resellerPrice / product.comparePrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/store/${slug}`} className="flex items-center gap-1.5 text-text-muted hover:text-text text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="bg-white rounded-2xl border border-border overflow-hidden aspect-square relative">
              {product.images.length > 0 ? (
                <Image src={product.images[selectedImg].url} alt={product.images[selectedImg].alt || product.name}
                  fill className="object-contain p-4" sizes="(max-width:1024px) 100vw, 50vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-text-muted" /></div>
              )}
              {discount > 0 && <Badge className="absolute top-3 left-3 bg-danger text-white">-{discount}%</Badge>}
              {product.images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImg(i => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedImg(i => (i + 1) % product.images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"><ChevronRight className="w-4 h-4" /></button>
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
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? "fill-warning text-warning" : "text-gray-200"}`} />)}</div>
                <span className="text-sm text-text-muted">{product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-primary">{fmt(product.resellerPrice)}</span>
              {discount > 0 && product.comparePrice && <span className="text-lg text-text-muted line-through">{fmt(product.comparePrice)}</span>}
            </div>

            {product.stock < 10 && <p className="text-sm text-warning mb-3">Only {product.stock} left in stock</p>}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-surface"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-surface"><Plus className="w-4 h-4" /></button>
              </div>
              <Button className="flex-1 h-11 rounded-full" onClick={() => {/* cart logic handled in store page */}}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart — {fmt(product.resellerPrice * qty)}
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
              <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            {/* Specs */}
            {product.specs && (
              <div className="bg-white rounded-xl border border-border p-4 mb-4">
                <h3 className="font-semibold text-text mb-2">Specifications</h3>
                <p className="text-sm text-text-muted whitespace-pre-line">{product.specs}</p>
              </div>
            )}

            {product.sku && <p className="text-xs text-text-muted">SKU: {product.sku}</p>}
          </div>
        </div>

        {/* Reviews */}
        {product.reviews.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-text mb-4">Customer Reviews</h2>
            <div className="grid gap-3">
              {product.reviews.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-warning text-warning" : "text-gray-200"}`} />)}</div>
                    <span className="text-sm font-medium text-text">{r.user.name || "Customer"}</span>
                    <span className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-text-muted">{r.comment}</p>}
                </div>
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

      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="text-text-muted text-xs">Powered by <a href="/" className="text-primary hover:underline font-medium">IntactConnect</a></p>
      </footer>
    </div>
  );
}
