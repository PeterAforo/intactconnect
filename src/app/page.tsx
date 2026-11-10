"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, animate, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, TrendingUp, ShieldCheck, Truck, FileText, Wallet,
  CheckCircle2, Store, Package, Search,
  MessageCircle, Calculator, ChevronDown, Copy, Check, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Accordion from "@radix-ui/react-accordion";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function fmt(n: number) {
  return `GH₵${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function CountUp({ to, prefix = "GH₵", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, {
      duration: 1.4, ease: EASE,
      onUpdate: (v) => { if (ref.current) ref.current.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`; },
    });
    return () => controls.stop();
  }, [inView, to, prefix, suffix]);
  return <span ref={ref}>{`${prefix}0${suffix}`}</span>;
}

// ── mini storefront mockup (honest interface fragment) ─────────────────────
function StorefrontMockup({ examples }: { examples: Any[] }) {
  const items = examples.slice(0, 4);
  const FALLBACK = ["iPhone 15 Pro", "Galaxy Buds 3", "AirPods Pro 3", "MacBook Air M3"];
  const shown = items.length ? items : FALLBACK.map((name, i) => ({ id: i, name, price: 0, resellerPrice: 0, commission: 0, image: null }));
  return (
    <div className="relative rounded-2xl bg-white shadow-2xl shadow-black/10 border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface/80">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-text-muted font-mono truncate border border-border/60">
          intactconnect.com.gh/store/<span className="text-primary font-semibold">your-store</span>
        </div>
      </div>
      <div className="px-5 py-4 bg-primary text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">Your Store Name</p>
          <p className="text-white/60 text-[11px]">Genuine Intact Ghana products</p>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 text-xs text-text-muted">
          <Search className="w-3.5 h-3.5" /> Search products...
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-4">
        {shown.map((p: Any) => (
          <div key={p.id} className="rounded-xl border border-border/70 overflow-hidden group/item">
            <div className="aspect-[4/3] bg-surface relative flex items-center justify-center overflow-hidden">
              {p.image ? (
                <Image src={p.image} alt="" fill className="object-cover group-hover/item:scale-105 transition-transform duration-500" sizes="160px" />
              ) : (
                <Package className="w-6 h-6 text-border" />
              )}
              {p.commission > 0 && (
                <span className="absolute top-1.5 left-1.5 bg-success/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  +{fmt(p.commission)}
                </span>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-medium text-text truncate">{p.name}</p>
              <p className="text-[11px] font-bold text-primary mt-0.5">{fmt(p.resellerPrice || p.price)}</p>
            </div>
          </div>
        ))}
      </div>
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-3 right-4 bg-white border border-border rounded-xl shadow-lg px-3.5 py-2 flex items-center gap-2"
      >
        <TrendingUp className="w-4 h-4 text-success" />
        <p className="text-[11px] font-semibold text-text">You keep the margin</p>
      </motion.div>
    </div>
  );
}

// ── earnings calculator (compact — category select) ────────────────────────
function EarningsCalculator({ margins }: { margins: Any[] }) {
  const cats = margins.length
    ? margins
    : [
        { categoryId: "a", categoryName: "Phones", marginPercent: 5 },
        { categoryId: "b", categoryName: "Accessories", marginPercent: 8 },
        { categoryId: "c", categoryName: "Appliances", marginPercent: 6 },
      ];
  const [catId, setCatId] = useState<string>(cats[0]?.categoryId || "a");
  const [items, setItems] = useState(20);
  const [avgPrice, setAvgPrice] = useState(1500);
  const cat = cats.find((c: Any) => c.categoryId === catId) || cats[0];
  const monthly = Math.ceil(avgPrice * (cat.marginPercent / 100)) * items;

  return (
    <div className="bg-white rounded-3xl border border-border shadow-xl shadow-black/5 overflow-hidden">
      <div className="grid md:grid-cols-[1.2fr_1fr]">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Earnings Calculator</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Category</label>
              <div className="relative">
                <select
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  className="w-full appearance-none bg-surface border border-border rounded-lg pl-3 pr-8 py-2.5 text-sm text-text font-medium focus:outline-none focus:border-primary/50"
                >
                  {cats.map((c: Any) => (
                    <option key={c.categoryId} value={c.categoryId}>{c.categoryName} — {c.marginPercent}%</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-text">Items / month</span>
                <span className="font-bold text-primary tabular-nums">{items}</span>
              </div>
              <input type="range" min={1} max={200} value={items} onChange={(e) => setItems(+e.target.value)} className="w-full accent-primary mt-2.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium text-text">Average item price</span>
              <span className="font-bold text-primary tabular-nums">{fmt(avgPrice)}</span>
            </div>
            <input type="range" min={100} max={20000} step={100} value={avgPrice} onChange={(e) => setAvgPrice(+e.target.value)} className="w-full accent-primary" />
          </div>
        </div>

        <div className="bg-primary text-white p-6 md:p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_80%_10%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1 relative">You could earn</p>
          <motion.p key={monthly} initial={{ scale: 0.96, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }} className="text-5xl md:text-6xl font-black tabular-nums tracking-tight relative">
            {fmt(monthly)}
          </motion.p>
          <p className="text-white/60 text-sm mt-1 relative">per month</p>
          <div className="mt-5 pt-4 border-t border-white/15 space-y-1.5 text-sm relative">
            <div className="flex justify-between"><span className="text-white/50">Per item</span><span className="font-semibold tabular-nums">{fmt(Math.ceil(avgPrice * (cat.marginPercent / 100)))}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Margin</span><span className="font-semibold tabular-nums">{cat.marginPercent}%</span></div>
            <div className="flex justify-between"><span className="text-white/50">Your cost</span><span className="font-semibold">GH₵0 — free</span></div>
          </div>
          <Link href="/register" className="mt-5 relative">
            <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-full font-semibold h-11">
              Start earning <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── static catalog strip (replaces marquee) ────────────────────────────────
function CatalogStrip({ margins }: { margins: Any[] }) {
  const names = margins.length ? margins.map((m: Any) => m.categoryName) : ["Phones", "Laptops", "Accessories", "Appliances", "Gadgets", "Audio"];
  return (
    <div className="border-y border-border bg-white">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Sell anything from Intact's catalog</span>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          {names.slice(0, 8).map((n: string, i: number) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-sm font-medium text-text flex items-center gap-5"
            >
              {n}{i < Math.min(names.length, 8) - 1 && <span className="w-1 h-1 rounded-full bg-border inline-block" />}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── newsletter ─────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setState("done");
      setMsg(data.already ? "You're already on the list — see you in your inbox." : "You're in! Watch your inbox for reseller tips.");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-border p-8 md:p-10 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-text tracking-tight">Selling tips, straight to your inbox</h3>
          <p className="text-text-muted text-sm mt-2 max-w-sm">Weekly reseller strategies, hot product drops, and what top sellers are doing differently. No spam.</p>
        </div>
        <div className="w-full md:w-auto md:min-w-[360px]">
          {state === "done" ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3 bg-success/10 text-success rounded-xl px-4 py-3.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{msg}</p>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 rounded-xl h-12 bg-surface border-border"
              />
              <Button type="submit" disabled={state === "loading"} className="rounded-xl h-12 px-6">
                {state === "loading" ? "..." : "Join"}
              </Button>
            </form>
          )}
          {state === "error" && <p className="text-danger text-xs mt-2">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [data, setData] = useState<Any>(null);
  const [copied, setCopied] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  useEffect(() => {
    fetch("/api/public/margins").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const margins: Any[] = data?.margins || [];
  const examples: Any[] = data?.examples || [];
  const stats = data?.stats || { products: 0, categories: 0, resellers: 0 };

  const features = [
    {
      icon: Store, title: "Your own storefront",
      desc: "A branded store link with your name, logo and theme — share it anywhere and it works 24/7.",
      card: "bg-violet-50 border-violet-200/60", chip: "bg-violet-500", iconColor: "text-white",
      hover: "hover:border-violet-300 hover:shadow-violet-500/10",
      image: "/img/african-american-business-woman-with-laptop.jpg", span: "md:col-span-2",
    },
    {
      icon: TrendingUp, title: "Commission on every sale",
      desc: "Transparent per-category margins — you see exactly what each sale earns.",
      card: "bg-emerald-50 border-emerald-200/60", chip: "bg-emerald-500", iconColor: "text-white",
      hover: "hover:border-emerald-300 hover:shadow-emerald-500/10",
    },
    {
      icon: Truck, title: "Intact delivers",
      desc: "Zero stock, zero delivery stress. We fulfill every order end-to-end.",
      card: "bg-amber-50 border-amber-200/60", chip: "bg-amber-500", iconColor: "text-white",
      hover: "hover:border-amber-300 hover:shadow-amber-500/10",
    },
    {
      icon: FileText, title: "Invoices & clients",
      desc: "Send pro invoices, keep client records, and build repeat business.",
      card: "bg-sky-50 border-sky-200/60", chip: "bg-sky-500", iconColor: "text-white",
      hover: "hover:border-sky-300 hover:shadow-sky-500/10",
    },
    {
      icon: Wallet, title: "MoMo & bank payouts",
      desc: "Withdraw your balance to MTN, Vodafone, AirtelTigo or your bank.",
      card: "bg-rose-50 border-rose-200/60", chip: "bg-rose-500", iconColor: "text-white",
      hover: "hover:border-rose-300 hover:shadow-rose-500/10",
    },
    {
      icon: ShieldCheck, title: "100% genuine products",
      desc: "Everything ships from Intact Ghana's catalog — real stock, real warranties.",
      card: "bg-teal-50 border-teal-200/60", chip: "bg-teal-500", iconColor: "text-white",
      hover: "hover:border-teal-300 hover:shadow-teal-500/10",
    },
  ];

  const steps = [
    { n: "01", t: "Apply & verify", d: "Create your account, upload your ID — we review and approve within 24 hours.", img: "/img/african-american-business-woman-with-laptop.jpg" },
    { n: "02", t: "Share your store", d: "Drop your link in WhatsApp, IG bio, TikTok — anywhere your people are.", img: "/img/people-identifical-clothes-african-couple-autumn-city.jpg" },
    { n: "03", t: "Earn & cash out", d: "Commission lands on every sale. Withdraw to MoMo or bank anytime.", img: "/img/african-american-woman-with-laptop-cafe.jpg" },
  ];

  const faqs = [
    { q: "How do I earn money?", a: "You get your own store link stocked with Intact Ghana products. Share it — when someone buys through your link, you earn the margin on that product's category. Commissions accrue instantly and are paid to your MoMo or bank account." },
    { q: "Do I need to buy stock?", a: "No. You never hold inventory. Intact Ghana handles sourcing, storage, packaging and delivery. Your only job is sharing your store." },
    { q: "How long does approval take?", a: "We review applications within 24 hours on business days. You'll get an email the moment you're approved, with your store link ready to share." },
    { q: "How and when do I get paid?", a: "Request a payout from your dashboard anytime. We pay via MTN MoMo, Vodafone Cash, AirtelTigo Money or bank transfer — typically within 48 hours of request." },
    { q: "What do I need to sign up?", a: "Your name, email, phone, a store name, a photo, and a national ID (Ghana Card, voter ID, passport, NHIS, or driver's license). ID verification keeps the marketplace safe for everyone." },
    { q: "Can I sell to companies?", a: "Yes — the platform includes invoicing and client management built for B2B orders. Many resellers sell bulk devices to offices and schools." },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] overflow-x-hidden">
      {/* ── Nav ── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/img/logo.png" alt="IntactConnect" width={180} height={50} className="h-11 w-auto" /></Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-text-muted">
            <a href="#how" className="hover:text-text transition-colors">How it works</a>
            <a href="#earnings" className="hover:text-text transition-colors">Earnings</a>
            <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
            <Link href="/register"><Button size="sm" className="rounded-full px-5">Get Started</Button></Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="pt-28 pb-16 md:pt-40 md:pb-28 px-4 relative bg-[#0d0b09] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(55%_55%_at_75%_15%,rgba(255,255,255,0.07),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_10%_90%,rgba(255,255,255,0.04),transparent)] pointer-events-none" />
        {/* subtle grain lines */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.06) 80px)" }} />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center relative">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 text-white rounded-full text-xs font-semibold tracking-wide mb-6"
            >
              <Store className="w-3.5 h-3.5" /> RESELLER PLATFORM BY INTACT GHANA
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
              className="text-[2.7rem] md:text-6xl lg:text-[4.2rem] font-bold text-white leading-[1.04] tracking-tight mb-6"
            >
              Your network is<br />
              <span className="bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">your income.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
              className="text-lg text-white/65 max-w-md mb-9 leading-relaxed"
            >
              Get a branded store stocked with Intact Ghana products. Share your link. Earn commission on every sale — zero stock, zero capital.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
              className="flex flex-col sm:flex-row gap-3 mb-9"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-8 h-12 text-base bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/40 w-full sm:w-auto">
                    Start earning — free <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <a href="#earnings">
                  <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base bg-transparent border-white/25 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto">
                    See what you'd earn
                  </Button>
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.36 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60"
            >
              {["Free to join", "No stock needed", "MoMo payouts"].map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />{t}
                </motion.span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            style={{ y: mockupY, opacity: mockupOpacity }}
            className="relative pb-6"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-white/15 via-transparent to-transparent rounded-[2.5rem] blur-2xl pointer-events-none" />
            <StorefrontMockup examples={examples} />
            {/* floating photo badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute -left-4 top-16 hidden md:block"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-xl rotate-[-6deg]">
                <Image src="/img/portrait-african-american-man-sitting-cafe-working-laptop.jpg" alt="Reseller working" width={96} height={96} className="object-cover w-full h-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Catalog strip (static — was marquee) ── */}
      <CatalogStrip margins={margins} />

      {/* ── Earnings calculator ── */}
      <section id="earnings" className="py-14 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Real numbers, real margins</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">See what you'd earn</h2>
            <p className="text-text-muted mt-3 max-w-lg mx-auto">These are the actual commission rates on your store — not marketing promises.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <EarningsCalculator margins={margins} />
          </motion.div>
        </div>
      </section>

      {/* ── How it works (with photos) ── */}
      <section id="how" className="py-16 md:py-24 px-4 bg-white border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Simple process</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">Start in 3 steps</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl overflow-hidden bg-surface border border-border/60 group"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={s.img}
                    alt={s.t}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 w-9 h-9 rounded-xl bg-white text-primary font-black text-sm flex items-center justify-center shadow-lg">
                    {s.n}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-text mb-1.5">{s.t}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commission transparency ── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Full transparency</span>
            <h2 className="text-3xl md:text-[2.5rem] font-bold text-text mt-3 mb-5 tracking-tight">Know your margin before you share</h2>
            <p className="text-text-muted leading-relaxed mb-6">
              Every category on your store has a published commission rate. When a customer buys, the margin is already baked into the price — what you see is what you keep.
            </p>
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5">
              <p className="text-sm text-text leading-relaxed">
                <span className="font-semibold text-primary">Example:</span> a phone listed at {fmt(5000)} with a 5% margin sells on your store for {fmt(5250)} — the {fmt(250)} difference is yours.
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl border border-border overflow-hidden shadow-lg shadow-black/5">
            <div className="px-5 py-4 border-b border-border bg-surface/60 flex items-center justify-between">
              <p className="font-semibold text-text text-sm">Commission by category</p>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Live rates</span>
            </div>
            <div className="divide-y divide-border/70">
              {(margins.length ? margins : [{ categoryName: "Phones", marginPercent: 5 }, { categoryName: "Accessories", marginPercent: 8 }, { categoryName: "Appliances", marginPercent: 6 }]).slice(0, 8).map((m: Any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="px-5 py-3.5 flex items-center justify-between"
                >
                  <span className="text-sm text-text">{m.categoryName}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-surface-dark overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, m.marginPercent * 10)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: EASE }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums w-10 text-right">{m.marginPercent}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Bento features ── */}
      <section className="py-16 md:py-24 px-4 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-primary font-semibold text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Why IntactConnect
            </span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">
              Everything you need to <span className="relative inline-block">hustle smart<span className="absolute left-0 right-0 bottom-1 h-3 bg-amber-300/60 -z-10 rounded-sm" /></span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -5, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
                className={`rounded-2xl border overflow-hidden hover:shadow-lg transition-all group ${f.card} ${f.hover} ${f.span || ""}`}
              >
                {f.image ? (
                  <div className="grid sm:grid-cols-[1.1fr_1fr] h-full">
                    <div className="p-6 flex flex-col justify-center">
                      <div className={`w-11 h-11 ${f.chip} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:-rotate-6 transition-transform`}>
                        <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                      </div>
                      <h3 className="font-bold text-text mb-1.5 text-lg">{f.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                    </div>
                    <div className="relative min-h-[160px]">
                      <Image src={f.image} alt={f.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className={`w-11 h-11 ${f.chip} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                      <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-text mb-1.5">{f.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo band: built for Ghana ── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Made for you</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">Built for how Ghana sells</h2>
            <p className="text-text-muted mt-3 max-w-lg mx-auto">On WhatsApp, on campus, in the office — your store works wherever your people are.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { img: "/img/african-american-business-woman-with-laptop.jpg", label: "Work from anywhere" },
              { img: "/img/girls-walk-along-streets-city.jpg", label: "Share on the go" },
              { img: "/img/portrait-african-american-man-sitting-cafe-working-laptop.jpg", label: "Your own business" },
              { img: "/img/african-american-woman-with-laptop-cafe.jpg", label: "Earn real money" },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className={`relative rounded-2xl overflow-hidden group ${i % 2 === 1 ? "md:mt-8" : ""}`}
              >
                <div className="relative aspect-[3/4]">
                  <Image src={p.img} alt={p.label} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-semibold">{p.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Numbers band ── */}
      <section className="py-14 px-4 bg-primary text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: stats.products, suffix: "+", label: "Genuine products" },
            { v: stats.categories, suffix: "", label: "Categories" },
            { v: stats.resellers, suffix: "", label: "Active resellers" },
            { v: 0, suffix: "", label: "Cedis to start", display: "GH₵0" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <p className="text-3xl md:text-4xl font-black tabular-nums">
                {s.display || <CountUp to={s.v} prefix="" suffix={s.suffix} />}
              </p>
              <p className="text-white/60 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Questions</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">Everything else you'd ask</h2>
          </motion.div>
          <Accordion.Root type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <Accordion.Item key={i} value={`faq-${i}`} className="bg-white rounded-xl border border-border overflow-hidden data-[state=open]:border-primary/40 data-[state=open]:shadow-md transition-all">
                <Accordion.Header>
                  <Accordion.Trigger className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-text text-sm hover:bg-surface/50 transition-colors [&[data-state=open]>svg]:rotate-180">
                    {f.q}
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-5 pb-5 text-sm text-text-muted leading-relaxed data-[state=open]:animate-[slideDown_0.2s_ease-out]">
                  {f.a}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="pb-16 md:pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Newsletter />
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/img/software-engineer-coding-laptop-focusing-deep-learning.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/85" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">Your side hustle<br className="hidden md:block" /> starts today</h2>
            <p className="text-white/75 mb-10 text-lg max-w-md mx-auto leading-relaxed">
              Free to join. No stock. No delivery stress. Just you, your phone, and your people.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-10 h-12 bg-white text-primary hover:bg-white/90 text-base font-semibold shadow-2xl w-full sm:w-auto">
                    Join IntactConnect <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { navigator.clipboard?.writeText("https://www.intactconnect.com.gh"); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="rounded-full px-8 h-12 border border-white/30 text-white hover:bg-white/10 transition-colors text-base font-medium flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Link copied" : "Share this page"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <Image src="/img/logo.png" alt="IntactConnect" width={170} height={48} className="h-10 w-auto" />
              <p className="text-text-muted text-xs mt-1.5">Reseller platform by Intact Ghana</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <Link href="/login" className="hover:text-text transition-colors">Login</Link>
              <Link href="/register" className="hover:text-text transition-colors">Register</Link>
              <a href="https://intactghana.com" target="_blank" rel="noopener" className="hover:text-text transition-colors">Intact Ghana</a>
              <a href="tel:+233543645126" className="hover:text-text transition-colors">+233 543 645 126</a>
            </div>
            <p className="text-text-muted text-xs">© {new Date().getFullYear()} IntactConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
