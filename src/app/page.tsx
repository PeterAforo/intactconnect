"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, animate } from "framer-motion";
import {
  ArrowRight, Users, TrendingUp, ShieldCheck, Truck, FileText, Wallet,
  Star, Zap, CheckCircle2, Store, Package, Search, ShoppingBag,
  MessageCircle, Sparkles, Calculator, ChevronDown, ChevronUp, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Accordion from "@radix-ui/react-accordion";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// ── helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `GH₵${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
}

function CountUp({ to, prefix = "GH₵", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, {
      duration: 1.4, ease: [0.16, 1, 0.3, 1],
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
    <div className="relative rounded-2xl bg-white shadow-2xl shadow-primary/10 border border-border overflow-hidden">
      {/* browser chrome */}
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
      {/* store header */}
      <div className="px-5 py-4 bg-gradient-to-r from-primary to-primary-light text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">Your Store Name</p>
          <p className="text-white/60 text-[11px]">Genuine Intact Ghana products</p>
        </div>
      </div>
      {/* search bar */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 text-xs text-text-muted">
          <Search className="w-3.5 h-3.5" /> Search products...
        </div>
      </div>
      {/* products */}
      <div className="grid grid-cols-2 gap-2.5 p-4">
        {shown.map((p: Any) => (
          <div key={p.id} className="rounded-xl border border-border/70 overflow-hidden">
            <div className="aspect-[4/3] bg-surface relative flex items-center justify-center">
              {p.image ? (
                <Image src={p.image} alt="" fill className="object-cover" sizes="160px" />
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
      {/* floating commission badge */}
      <div className="absolute -bottom-3 right-4 bg-white border border-border rounded-xl shadow-lg px-3.5 py-2 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-success" />
        <p className="text-[11px] font-semibold text-text">You keep the margin</p>
      </div>
    </div>
  );
}

// ── earnings calculator ────────────────────────────────────────────────────
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
    <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary/5 overflow-hidden">
      <div className="grid md:grid-cols-[1.2fr_1fr]">
        <div className="p-7 md:p-9">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Earnings Calculator</span>
          </div>
          <label className="block text-sm font-medium text-text mb-2">Category</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {cats.map((c: Any) => (
              <button
                key={c.categoryId}
                onClick={() => setCatId(c.categoryId)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all border ${catId === c.categoryId ? "bg-primary text-white border-primary shadow-md shadow-primary/25" : "bg-surface text-text-muted border-border hover:border-primary/40"}`}
              >
                {c.categoryName} · {c.marginPercent}%
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-text">Items sold per month</span>
                <span className="font-bold text-primary tabular-nums">{items}</span>
              </div>
              <input type="range" min={1} max={200} value={items} onChange={(e) => setItems(+e.target.value)} className="w-full accent-primary" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-text">Average item price</span>
                <span className="font-bold text-primary tabular-nums">{fmt(avgPrice)}</span>
              </div>
              <input type="range" min={100} max={20000} step={100} value={avgPrice} onChange={(e) => setAvgPrice(+e.target.value)} className="w-full accent-primary" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-7 md:p-9 flex flex-col justify-center">
          <p className="text-white/70 text-xs uppercase tracking-widest mb-1">You could earn</p>
          <p className="text-5xl md:text-6xl font-black tabular-nums tracking-tight">
            {fmt(monthly)}
          </p>
          <p className="text-white/70 text-sm mt-1">per month</p>
          <div className="mt-6 pt-5 border-t border-white/20 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/60">Commission per item</span><span className="font-semibold tabular-nums">{fmt(Math.ceil(avgPrice * (cat.marginPercent / 100)))}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Margin rate</span><span className="font-semibold tabular-nums">{cat.marginPercent}%</span></div>
            <div className="flex justify-between"><span className="text-white/60">Your cost</span><span className="font-semibold">GH₵0 — free</span></div>
          </div>
          <Link href="/register" className="mt-6">
            <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-full font-semibold h-11">
              Start earning <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── marquee ────────────────────────────────────────────────────────────────
function CategoryMarquee({ margins }: { margins: Any[] }) {
  const names = margins.length ? margins.map((m: Any) => m.categoryName) : ["Phones", "Laptops", "Accessories", "Appliances", "Gadgets", "Audio"];
  const row = [...names, ...names];
  return (
    <div className="overflow-hidden border-y border-border bg-white py-4">
      <div className="flex gap-10 whitespace-nowrap animate-[marquee_30s_linear_infinite] w-max">
        {row.map((n, i) => (
          <span key={i} className="text-sm font-medium text-text-muted flex items-center gap-10">
            {n} <Sparkles className="w-3.5 h-3.5 text-primary/40" />
          </span>
        ))}
      </div>
      <style jsx>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [data, setData] = useState<Any>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    fetch("/api/public/margins").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const margins: Any[] = data?.margins || [];
  const examples: Any[] = data?.examples || [];
  const stats = data?.stats || { products: 0, categories: 0, resellers: 0 };

  const features = [
    { icon: Store, title: "Your own storefront", desc: "A branded store link with your name, logo and theme — share it anywhere.", span: "md:col-span-2" },
    { icon: TrendingUp, title: "Commission on every sale", desc: "Transparent per-category margins — you see exactly what each sale earns." },
    { icon: Truck, title: "Intact delivers", desc: "Zero stock, zero delivery stress. We fulfill every order end-to-end." },
    { icon: FileText, title: "Invoices & clients", desc: "Send pro invoices, keep client records, and build repeat business." },
    { icon: Wallet, title: "MoMo & bank payouts", desc: "Withdraw your balance to MTN, Vodafone, AirtelTigo or your bank." },
    { icon: ShieldCheck, title: "100% genuine products", desc: "Everything ships from Intact Ghana's catalog — real stock, real warranties." },
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
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-border">
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
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,rgba(124,58,237,0.08),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wide mb-6">
              <Zap className="w-3.5 h-3.5" /> RESELLER PLATFORM BY INTACT GHANA
            </span>
            <h1 className="text-[2.7rem] md:text-6xl lg:text-[4.2rem] font-bold text-text leading-[1.04] tracking-tight mb-6">
              Your network is<br />
              <span className="gradient-text">your income.</span>
            </h1>
            <p className="text-lg text-text-muted max-w-md mb-9 leading-relaxed">
              Get a branded store stocked with Intact Ghana products. Share your link. Earn commission on every sale — zero stock, zero capital.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-9">
              <Link href="/register">
                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/25 w-full sm:w-auto">
                  Start earning — free <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#earnings">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base w-full sm:w-auto">
                  See what you'd earn
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted">
              {["Free to join", "No stock needed", "MoMo payouts"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" />{t}</span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative pb-6"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/15 via-transparent to-transparent rounded-[2.5rem] blur-2xl pointer-events-none" />
            <StorefrontMockup examples={examples} />
          </motion.div>
        </div>
      </section>

      {/* ── Category marquee ── */}
      <CategoryMarquee margins={margins} />

      {/* ── Earnings calculator ── */}
      <section id="earnings" className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Real numbers, real margins</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">See what you'd earn</h2>
            <p className="text-text-muted mt-3 max-w-lg mx-auto">These are the actual commission rates on your store — not marketing promises.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <EarningsCalculator margins={margins} />
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-16 md:py-24 px-4 bg-white border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Simple process</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">Start in 3 steps</h2>
          </motion.div>
          <div className="relative grid md:grid-cols-3 gap-10 md:gap-6">
            <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
            {[
              { n: "01", t: "Apply & verify", d: "Create your account, upload your ID — we review and approve within 24 hours." },
              { n: "02", t: "Share your store", d: "Drop your link in WhatsApp, IG bio, TikTok — anywhere your people are." },
              { n: "03", t: "Earn & cash out", d: "Commission lands on every sale. Withdraw to MoMo or bank anytime." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary text-white font-black text-lg flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30 relative z-10">
                  {s.n}
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{s.t}</h3>
                <p className="text-sm text-text-muted leading-relaxed max-w-[260px] mx-auto">{s.d}</p>
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
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl border border-border overflow-hidden shadow-lg shadow-primary/5">
            <div className="px-5 py-4 border-b border-border bg-surface/60 flex items-center justify-between">
              <p className="font-semibold text-text text-sm">Commission by category</p>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Live rates</span>
            </div>
            <div className="divide-y divide-border/70">
              {(margins.length ? margins : [{ categoryName: "Phones", marginPercent: 5 }, { categoryName: "Accessories", marginPercent: 8 }, { categoryName: "Appliances", marginPercent: 6 }]).slice(0, 8).map((m: Any, i: number) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-sm text-text">{m.categoryName}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-surface-dark overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full" style={{ width: `${Math.min(100, m.marginPercent * 10)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums w-10 text-right">{m.marginPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Bento features ── */}
      <section className="py-16 md:py-24 px-4 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Why IntactConnect</span>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-text mt-3 tracking-tight">Everything you need to hustle smart</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`bg-surface rounded-2xl p-6 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group ${f.span || ""}`}
              >
                <div className="w-11 h-11 bg-white rounded-xl border border-border/60 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary transition-colors">
                  <f.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-text mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
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
            <div key={i}>
              <p className="text-3xl md:text-4xl font-black tabular-nums">
                {s.display || <CountUp to={s.v} prefix="" suffix={s.suffix} />}
              </p>
              <p className="text-white/60 text-sm mt-1">{s.label}</p>
            </div>
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

      {/* ── Final CTA ── */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-[#3b0764]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">Your side hustle<br className="hidden md:block" /> starts today</h2>
            <p className="text-white/75 mb-10 text-lg max-w-md mx-auto leading-relaxed">
              Free to join. No stock. No delivery stress. Just you, your phone, and your people.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="rounded-full px-10 h-12 bg-white text-primary hover:bg-white/90 text-base font-semibold shadow-2xl w-full sm:w-auto">
                  Join IntactConnect <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <button
                onClick={() => { navigator.clipboard?.writeText("https://www.intactconnect.com.gh"); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="rounded-full px-8 h-12 border border-white/30 text-white hover:bg-white/10 transition-colors text-base font-medium flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Link copied" : "Share this page"}
              </button>
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
