"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, MoreHorizontal, ShoppingBag, Wallet, Package,
  Store, Share2, LifeBuoy, Plus, TrendingUp, TrendingDown, Clock, ChevronDown, Check,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

/* ── types ─────────────────────────────────────────── */
interface Stats {
  totalSales: number; totalOrders: number; totalCommission: number; totalClients: number;
  commissionBalance: number; pendingCommission: number;
  pendingPayout: { amount: number; requestedAt: string } | null;
  thisMonth: { sales: number; commission: number; orders: number };
  lastMonth: { sales: number; commission: number; orders: number };
  recentOrders: { id: string; orderNumber: string; total: number; commission: number; status: string; createdAt: string; client: { name: string } | null }[];
}
interface DayPoint { date: string; sales: number; commission: number; orders: number }
interface Analytics { salesDaily?: DayPoint[]; daily?: number[]; views30?: number; conversion?: number; topProducts?: any[] }
interface Me { user: { name: string }; reseller: { storeName: string; storeSlug: string; picture: string } | null }
interface Client { id: string; name: string; _count: { orders: number } }

/* ── helpers ───────────────────────────────────────── */
function Sparkline({ data, color = "#0d0b09", w = 72, h = 26 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data.length) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function pctChange(cur: number, prev: number) {
  if (!prev) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-sky-50 text-sky-700",
  confirmed: "bg-sky-50 text-sky-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

function TrendChart({ data, range }: { data: DayPoint[]; range: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const slice = data.slice(-range);
  const W = 560, H = 170, P = { t: 14, r: 8, b: 20, l: 34 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;

  const seriesA = slice.map((d) => d.sales);
  const seriesB = slice.map((d) => d.commission);
  const maxA = Math.max(...seriesA, 1), maxB = Math.max(...seriesB, 1);

  const path = (vals: number[], max: number) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${(P.l + (i / Math.max(vals.length - 1, 1)) * iw).toFixed(1)},${(P.t + ih - (v / max) * ih).toFixed(1)}`).join(" ");

  const yTicks = [0, 0.5, 1].map((f) => ({ y: P.t + ih - f * ih, label: formatPrice(maxA * f) }));
  const xIdx = [0, Math.floor(slice.length / 2), slice.length - 1];

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - P.l) / iw) * (slice.length - 1));
    setHover(Math.max(0, Math.min(slice.length - 1, idx)));
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Sales and commission trend chart">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={t.y} y2={t.y} stroke="#eceae6" strokeWidth="1" />
            <text x={P.l - 6} y={t.y + 3} textAnchor="end" fontSize="9" fill="#a8a29a">{t.label}</text>
          </g>
        ))}
        {xIdx.map((i) => (
          <text key={i} x={P.l + (i / Math.max(slice.length - 1, 1)) * iw} y={H - 4} textAnchor="middle" fontSize="9" fill="#a8a29a">
            {new Date(slice[i]?.date || "").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </text>
        ))}
        <path d={path(seriesB, maxB)} fill="none" stroke="#b8b2a7" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={path(seriesA, maxA)} fill="none" stroke="#0d0b09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && slice[hover] && (
          <g>
            <line x1={P.l + (hover / Math.max(slice.length - 1, 1)) * iw} x2={P.l + (hover / Math.max(slice.length - 1, 1)) * iw} y1={P.t} y2={P.t + ih} stroke="#d6d3d1" strokeWidth="1" />
            <circle cx={P.l + (hover / Math.max(slice.length - 1, 1)) * iw} cy={P.t + ih - (seriesA[hover] / maxA) * ih} r="3.5" fill="#0d0b09" />
            <circle cx={P.l + (hover / Math.max(slice.length - 1, 1)) * iw} cy={P.t + ih - (seriesB[hover] / maxB) * ih} r="3" fill="#b8b2a7" />
          </g>
        )}
      </svg>
      {hover !== null && slice[hover] && (
        <div className="flex justify-center -mt-1 mb-1">
          <div className="bg-[#1c1917] text-white text-[12px] rounded-lg px-2.5 py-1.5 flex gap-3">
            <span>{new Date(slice[hover].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            <span className="font-semibold">{formatPrice(slice[hover].sales)}</span>
            <span className="text-white/60">+{formatPrice(slice[hover].commission)}</span>
          </div>
        </div>
      )}
      {/* accessible data summary */}
      <table className="sr-only">
        <caption>Daily sales and commission for the selected period</caption>
        <tbody>
          {slice.map((d, i) => <tr key={i}><td>{d.date}</td><td>{d.sales}</td><td>{d.commission}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

const RANGES = [7, 30, 90];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [metricRange, setMetricRange] = useState(30);
  const [chartRange, setChartRange] = useState(30);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const copyStoreLink = async () => {
    const url = me?.reseller ? `https://www.intactconnect.com.gh/store/${me.reseller.storeSlug}` : window.location.origin;
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/dashboard/analytics").then((r) => r.json()).catch(() => null),
      fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
      fetch("/api/dashboard/clients").then((r) => r.json()).catch(() => []),
      fetch("/api/dashboard/orders").then((r) => r.json()).catch(() => []),
    ]).then(([s, a, m, c, o]) => {
      setStats(s); setAnalytics(a); setMe(m);
      setClients(Array.isArray(c) ? c : []);
      setOrders(Array.isArray(o) ? o : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (me?.user.name || "").split(" ")[0] || "there";

  const daily: DayPoint[] = analytics?.salesDaily || [];

  // Metric period sums + prior-period comparison (client-side from 90d series)
  const metricData = useMemo(() => {
    const sum = (arr: DayPoint[], key: "sales" | "commission" | "orders") => arr.reduce((s, d) => s + d[key], 0);
    const cur = daily.slice(-metricRange);
    const prev = daily.slice(-metricRange * 2, -metricRange);
    return {
      sales: { value: sum(cur, "sales"), prev: sum(prev, "sales"), spark: cur.map((d) => d.sales) },
      orders: { value: sum(cur, "orders"), prev: sum(prev, "orders"), spark: cur.map((d) => d.orders) },
      commission: { value: sum(cur, "commission"), prev: sum(prev, "commission"), spark: cur.map((d) => d.commission) },
    };
  }, [daily, metricRange]);

  // Featured panel sparkline: last 14 days commission + wow trend
  const featuredSpark = useMemo(() => daily.slice(-14).map((d) => d.commission), [daily]);
  const last7 = daily.slice(-7).reduce((s, d) => s + d.commission, 0);
  const prev7 = daily.slice(-14, -7).reduce((s, d) => s + d.commission, 0);
  const trendPct = pctChange(last7, prev7);

  const topClients = useMemo(
    () => [...clients].sort((a, b) => (b._count?.orders || 0) - (a._count?.orders || 0)).slice(0, 6),
    [clients]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => ["pending_payment", "pending", "processing"].includes(o.status)).slice(0, 3),
    [orders]
  );

  const recentOrders = (stats?.recentOrders || []).slice(0, 6);

  const metricCards = [
    { label: "Sales", icon: ShoppingBag, tint: "bg-[#eef6f0]", value: metricData.sales.value, prev: metricData.sales.prev, spark: metricData.sales.spark, href: "/dashboard/orders", fmt: true },
    { label: "Orders", icon: Package, tint: "bg-[#eef2fa]", value: metricData.orders.value, prev: metricData.orders.prev, spark: metricData.orders.spark, href: "/dashboard/orders", fmt: false },
    { label: "Commission earned", icon: Wallet, tint: "bg-[#faf3e4]", value: metricData.commission.value, prev: metricData.commission.prev, spark: metricData.commission.spark, href: "/dashboard/payouts", fmt: true },
  ];

  return (
    <div className="px-5 sm:px-7 py-6 w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.05]">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1917] tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-[13px] text-[#8a857c] mt-0.5">Here&apos;s how your store is doing.</p>
        </div>
        <div className="flex items-center gap-2">
          {me?.reseller && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#f0efec] hover:bg-[#e6e4df] text-[13px] font-medium text-[#3a362f] transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                {me.reseller.storeName}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 top-10 z-40 w-52 bg-white rounded-xl border border-black/[0.07] shadow-lg py-1.5">
                    {[
                      { label: "View public store", href: `https://www.intactconnect.com.gh/store/${me.reseller.storeSlug}`, external: true },
                      { label: "Store branding", href: "/dashboard/onboarding" },
                      { label: "Store settings", href: "/dashboard/settings" },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-[13px] text-[#3a362f] hover:bg-[#f5f4f1] transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {([
            { icon: Store, onClick: () => window.open(me?.reseller ? `https://www.intactconnect.com.gh/store/${me.reseller.storeSlug}` : "/dashboard", "_blank"), label: "View store" },
            { icon: copied ? Check : Share2, onClick: copyStoreLink, label: copied ? "Link copied" : "Copy store link" },
            { icon: Package, href: "/dashboard/catalog", label: "Catalog", external: false },
            { icon: LifeBuoy, href: "https://wa.me/233000000000", label: "Support", external: true },
          ] as { icon: React.ComponentType<{ className?: string }>; href?: string; onClick?: () => void; label: string; external?: boolean }[]).map((b) =>
            b.href ? (
              <Link
                key={b.label}
                href={b.href}
                target={b.external ? "_blank" : undefined}
                aria-label={b.label}
                title={b.label}
                className="w-9 h-9 rounded-full bg-[#f5f4f1] hover:bg-[#eceae5] text-[#4a463f] flex items-center justify-center transition-colors"
              >
                <b.icon className="w-4 h-4" />
              </Link>
            ) : (
              <button
                key={b.label}
                onClick={b.onClick}
                aria-label={b.label}
                title={b.label}
                className="w-9 h-9 rounded-full bg-[#f5f4f1] hover:bg-[#eceae5] text-[#4a463f] flex items-center justify-center transition-colors"
              >
                <b.icon className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 mt-5">
        {/* ══ Primary column ══ */}
        <div className="min-w-0 space-y-4">

          {/* Featured summary — dark panel */}
          <div className="rounded-2xl bg-[#0d0b09] text-white p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_85%_20%,rgba(255,255,255,0.07),transparent)] pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/50">Available commission</p>
                <p className="text-[12px] text-white/40 mt-1">Withdraw to MoMo or bank anytime</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Sparkline data={featuredSpark} color="#ffffff" w={76} h={30} />
                <span className={`text-[12px] font-semibold px-2 py-1 rounded-full ${trendPct >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                  {trendPct >= 0 ? "↑" : "↓"} {Math.abs(trendPct)}%
                </span>
              </div>
            </div>
            <div className="relative flex items-end justify-between gap-4 mt-6">
              <p className="text-4xl sm:text-[44px] font-bold tracking-tight tabular-nums leading-none">
                {loading ? "—" : formatPrice(stats?.commissionBalance ?? 0)}
              </p>
              <div className="flex gap-2 shrink-0">
                <Link href="/dashboard/payouts" className="h-9 px-4 rounded-full bg-white text-[#0d0b09] text-[13px] font-semibold flex items-center hover:bg-white/90 transition-colors">
                  Request payout
                </Link>
                <Link href="/dashboard/share" className="h-9 px-4 rounded-full border border-white/25 text-white text-[13px] font-semibold flex items-center hover:bg-white/10 transition-colors">
                  Share store
                </Link>
              </div>
            </div>
            {(stats?.pendingCommission ?? 0) > 0 && (
              <p className="relative text-[12px] text-white/45 mt-3">
                +{formatPrice(stats!.pendingCommission)} pending from recent orders
              </p>
            )}
          </div>

          {/* Metric cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Overview</h2>
              <div className="flex gap-1 bg-[#f0efec] rounded-full p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setMetricRange(r)}
                    className={`h-6 px-2.5 rounded-full text-[12px] font-medium transition-colors ${metricRange === r ? "bg-white text-[#1c1917] shadow-sm" : "text-[#8a857c] hover:text-[#1c1917]"}`}
                  >
                    {r}D
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {metricCards.map((m) => {
                const change = pctChange(m.value, m.prev);
                return (
                  <div key={m.label} className={`rounded-xl ${m.tint} p-4 relative`}>
                    <div className="flex items-start justify-between">
                      <p className="text-[12px] font-medium text-[#5c574e] uppercase tracking-wide">{m.label}</p>
                      <Link href={m.href} aria-label={`View ${m.label}`} className="text-[#8a857c] hover:text-[#1c1917] transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <p className="text-[26px] font-bold text-[#1c1917] tabular-nums leading-none">
                        {loading ? "—" : m.fmt ? formatPrice(m.value) : Math.round(m.value)}
                      </p>
                      <Sparkline data={m.spark.slice(-30)} color="#0d0b09" w={64} h={24} />
                    </div>
                    <p className={`text-[12px] mt-2 flex items-center gap-1 ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {change >= 0 ? "+" : ""}{change}% vs previous {metricRange} days
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Sales trend</h2>
              <div className="flex items-center gap-4 text-[12px] text-[#6b665e]">
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#0d0b09] rounded" /> Sales</span>
                <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-[#b8b2a7]" /> Commission</span>
              </div>
              <div className="flex gap-1 bg-[#f0efec] rounded-full p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`h-6 px-2.5 rounded-full text-[12px] font-medium transition-colors ${chartRange === r ? "bg-white text-[#1c1917] shadow-sm" : "text-[#8a857c] hover:text-[#1c1917]"}`}
                  >
                    {r}D
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="h-[170px] bg-[#f5f4f1] rounded-lg animate-pulse" />
            ) : daily.length ? (
              <TrendChart data={daily} range={chartRange} />
            ) : (
              <div className="h-[170px] flex items-center justify-center text-[13px] text-[#a8a29a]">
                No sales yet — share your store link to get your first order.
              </div>
            )}
          </div>

          {/* Bottom widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top clients */}
            <div className="bg-white rounded-xl border border-black/[0.05] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-[#1c1917]">Top clients</h2>
                <div className="flex items-center gap-2">
                  <Link href="/dashboard/clients" className="text-[12px] font-medium text-[#6b665e] hover:text-[#1c1917] flex items-center gap-0.5">
                    View all <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <Link href="/dashboard/clients" aria-label="Add client" className="w-6 h-6 rounded-full bg-[#f0efec] hover:bg-[#e6e4df] flex items-center justify-center text-[#4a463f]">
                    <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              {topClients.length ? (
                <div className="flex items-center">
                  {topClients.map((c, i) => (
                    <div
                      key={c.id}
                      title={`${c.name} — ${c._count?.orders || 0} orders`}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white border-2 border-white -ml-2 first:ml-0"
                      style={{ background: ["#0d0b09", "#3f5f8a", "#6b7f3a", "#8a5a44", "#5a4a7a", "#4a7a72"][i % 6], zIndex: 6 - i }}
                    >
                      {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                  ))}
                  {clients.length > 6 && (
                    <div className="w-10 h-10 rounded-full bg-[#f0efec] text-[#6b665e] text-[12px] font-bold flex items-center justify-center border-2 border-white -ml-2">
                      +{clients.length - 6}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-[#a8a29a]">Clients appear here after their first order.</p>
              )}
              <p className="text-[12px] text-[#8a857c] mt-3">{stats?.totalClients ?? 0} total clients</p>
            </div>

            {/* Pending items */}
            <div className="bg-white rounded-xl border border-black/[0.05] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-[#1c1917]">Needs attention</h2>
                <Link href="/dashboard/orders" className="text-[12px] font-medium text-[#6b665e] hover:text-[#1c1917] flex items-center gap-0.5">
                  View all <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {stats?.pendingPayout && (
                  <Link href="/dashboard/payouts" className="flex items-center gap-3 rounded-lg bg-[#faf3e4] px-3 py-2.5 hover:bg-[#f5ebd3] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-amber-700" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1c1917] truncate">Payout of {formatPrice(stats.pendingPayout.amount)} requested</p>
                      <p className="text-[12px] text-[#8a857c]">Awaiting admin approval</p>
                    </div>
                    <span className="text-[12px] font-semibold text-amber-700">Pending</span>
                  </Link>
                )}
                {pendingOrders.map((o) => (
                  <Link key={o.id} href="/dashboard/orders" className="flex items-center gap-3 rounded-lg bg-[#f5f4f1] px-3 py-2.5 hover:bg-[#eceae5] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-sky-700" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1c1917] truncate">{o.orderNumber} · {o.client?.name || "Customer"}</p>
                      <p className="text-[12px] text-[#8a857c]">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold text-[#1c1917] tabular-nums">{formatPrice(o.total)}</p>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[o.status] || "bg-[#f0efec] text-[#6b665e]"}`}>{o.status}</span>
                    </div>
                  </Link>
                ))}
                {!stats?.pendingPayout && pendingOrders.length === 0 && (
                  <p className="text-[13px] text-[#a8a29a] text-center py-6">All caught up — nothing needs attention.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ Right rail ══ */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Recent activity</h2>
              <Link href="/dashboard/orders" className="text-[12px] font-medium text-[#6b665e] hover:text-[#1c1917]">30 days</Link>
            </div>
            {recentOrders.length ? (
              <div className="divide-y divide-black/[0.04]">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-[#eef2fa] flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#3f5f8a]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#1c1917] truncate">{o.orderNumber}</p>
                      <p className="text-[12px] text-[#8a857c]">{o.client?.name || "Customer"} · {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold text-[#1c1917] tabular-nums">{formatPrice(o.total)}</p>
                      <span className={`text-[9px] font-semibold ${o.commission > 0 ? "text-emerald-700" : "text-[#a8a29a]"}`}>+{formatPrice(o.commission)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#a8a29a] py-6 text-center">No orders yet.</p>
            )}
          </div>

          {/* Resources */}
          <div className="bg-white rounded-xl border border-black/[0.05] p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Resources</h2>
              <Link href="/dashboard/catalog" className="text-[12px] font-medium text-[#6b665e] hover:text-[#1c1917] flex items-center gap-0.5">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2.5 mt-auto">
              <Link href="/dashboard/payouts" className="block rounded-xl bg-[#eef6f0] p-4 hover:bg-[#e2f0e7] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Wallet className="w-4 h-4 text-emerald-700" /></div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1c1917]">Earnings</p>
                    <p className="text-[15px] font-bold text-[#1c1917] tabular-nums">{loading ? "—" : formatPrice(stats?.commissionBalance ?? 0)}</p>
                  </div>
                </div>
                <p className="text-[12px] text-emerald-800/70 mt-2 font-medium">Withdraw to MoMo or bank →</p>
              </Link>
              <Link
                href={me?.reseller ? `https://www.intactconnect.com.gh/store/${me.reseller.storeSlug}` : "/dashboard/share"}
                target={me?.reseller ? "_blank" : undefined}
                className="block rounded-xl bg-[#eef2fa] p-4 hover:bg-[#e2eaf8] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#3f5f8a]/15 flex items-center justify-center"><Store className="w-4 h-4 text-[#3f5f8a]" /></div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1c1917] truncate">{me?.reseller?.storeName || "Your storefront"}</p>
                    <p className="text-[12px] text-[#8a857c] truncate">intactconnect.com.gh/store/{me?.reseller?.storeSlug || "…"}</p>
                  </div>
                </div>
                <p className="text-[12px] text-[#3f5f8a] mt-2 font-medium">Share your store link →</p>
              </Link>
              <Link href="/dashboard/share" className="block rounded-xl bg-[#faf3e4] p-4 hover:bg-[#f5ebd3] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center"><Share2 className="w-4 h-4 text-amber-700" /></div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1c1917]">Refer & earn</p>
                    <p className="text-[12px] text-[#8a857c]">GH₵25 per reseller you recruit</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only: leaderboard + top products kept compact */}
      {(analytics?.topProducts?.length ?? 0) > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-black/[0.05] p-5">
          <h2 className="text-[15px] font-semibold text-[#1c1917] mb-3">Top viewed products · 30d</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {analytics!.topProducts!.slice(0, 3).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg bg-[#f5f4f1] px-3 py-2.5">
                {p.image ? <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg bg-[#e6e4df]" />}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#1c1917] truncate">{p.name}</p>
                  <p className="text-[12px] text-[#8a857c]">{p.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
