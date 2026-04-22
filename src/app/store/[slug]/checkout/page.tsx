"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartItem {
  id: string; name: string; price: number; image: string | null; qty: number;
}

export default function CheckoutPage() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", region: "",
    paymentMethod: "cod", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const cartParam = searchParams.get("cart");
      if (cartParam) setCart(JSON.parse(decodeURIComponent(cartParam)));
    } catch { /* invalid cart data */ }
  }, [searchParams]);

  const update = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const formatPrice = (p: number) => `GH₵${p.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = 50;
  const total = subtotal + shipping;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.phone.trim()) e.phone = "Phone required";
    if (!form.address.trim()) e.address = "Address required";
    if (!form.city.trim()) e.city = "City required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) { setError("Cart is empty"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/store/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.id, quantity: i.qty, price: i.price })),
          shipping,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");
      setSuccess({ orderNumber: data.orderNumber });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-border shadow-lg">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Order Placed!</h2>
          <p className="text-text-muted mb-2">Your order <span className="font-mono font-bold text-text">{success.orderNumber}</span> has been received.</p>
          <p className="text-text-muted text-sm mb-6">The store owner will contact you to confirm delivery details.</p>
          <Link href={`/store/${slug}`}><Button className="rounded-full">Continue Shopping</Button></Link>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 text-center">
        <Package className="w-12 h-12 text-text-muted mb-3" />
        <h2 className="text-xl font-bold text-text mb-2">Cart is Empty</h2>
        <Link href={`/store/${slug}`} className="text-primary hover:underline text-sm">Back to Store</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href={`/store/${slug}`} className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-2xl border border-border p-6">
                <h1 className="text-xl font-bold text-text mb-4">Checkout</h1>
                {error && <div className="bg-danger/10 text-danger rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Full Name *</label>
                      <Input value={form.name} onChange={(e) => update("name", e.target.value)} className={errors.name ? "border-danger" : ""} />
                      {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Phone *</label>
                      <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={errors.phone ? "border-danger" : ""} />
                      {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1">Email (optional)</label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1">Address *</label>
                    <Input value={form.address} onChange={(e) => update("address", e.target.value)} className={errors.address ? "border-danger" : ""} />
                    {errors.address && <p className="text-danger text-xs mt-1">{errors.address}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">City *</label>
                      <Input value={form.city} onChange={(e) => update("city", e.target.value)} className={errors.city ? "border-danger" : ""} />
                      {errors.city && <p className="text-danger text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Region</label>
                      <Input value={form.region} onChange={(e) => update("region", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1">Payment Method</label>
                    <select value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                      <option value="cod">Cash on Delivery</option>
                      <option value="momo">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1">Notes</label>
                    <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none" />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Place Order ({formatPrice(total)})
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-border p-4 sticky top-4">
              <h2 className="font-semibold text-text mb-3">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-surface" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text truncate">{item.name}</p>
                      <p className="text-xs text-text-muted">x{item.qty}</p>
                    </div>
                    <p className="text-xs font-bold text-text">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Shipping</span>
                  <span className="text-text">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border">
                  <span className="text-text">Total</span>
                  <span className="text-text">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
