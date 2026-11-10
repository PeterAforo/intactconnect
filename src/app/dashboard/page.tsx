"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingCart, Users, Wallet, ArrowUpRight, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalClients: number;
  commissionBalance: number;
  recentOrders: { id: string; orderNumber: string; total: number; commission: number; status: string; createdAt: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/dashboard/analytics").then((r) => r.json()).then(setAnalytics).catch(() => {});
    fetch("/api/dashboard/leaderboard").then((r) => r.json()).then(setBoard).catch(() => {});
  }, []);

  const cards = [
    { label: "Total Sales", value: stats ? formatPrice(stats.totalSales) : "—", icon: TrendingUp, color: "text-success bg-success/10" },
    { label: "Orders", value: stats?.totalOrders ?? "—", icon: ShoppingCart, color: "text-info bg-info/10" },
    { label: "Clients", value: stats?.totalClients ?? "—", icon: Users, color: "text-primary bg-primary/10" },
    { label: "Commission Balance", value: stats ? formatPrice(stats.commissionBalance) : "—", icon: Wallet, color: "text-warning bg-warning/10" },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted text-sm">Welcome back! Here&apos;s your overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border border-border p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-text">{loading ? <span className="h-7 w-20 bg-surface rounded animate-pulse inline-block" /> : card.value}</p>
            <p className="text-text-muted text-xs mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-border">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text">Recent Orders</h2>
          <a href="/dashboard/orders" className="text-primary text-sm flex items-center gap-1 hover:underline">
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="divide-y divide-border">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                    <Package className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{order.orderNumber}</p>
                    <p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text">{formatPrice(order.total)}</p>
                  <p className="text-xs text-success">+{formatPrice(order.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-sm">No orders yet. Share your store link to start selling!</p>
          </div>
        )}
      </div>

      {/* Analytics + Leaderboard */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        {/* Store analytics */}
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="font-semibold text-text mb-3">Store Performance</h2>
          {!analytics ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 bg-surface rounded animate-pulse" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Views (7d)", value: analytics.views7 },
                  { label: "Views (30d)", value: analytics.views30 },
                  { label: "Conversion", value: `${analytics.conversion}%` },
                ].map((m) => (
                  <div key={m.label} className="bg-surface rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-text tabular-nums">{m.value}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
              {/* 14-day sparkline */}
              <div className="flex items-end gap-1 h-14 mb-4">
                {(analytics.daily || []).map((v: number, i: number) => {
                  const max = Math.max(...(analytics.daily || [1]), 1);
                  return <div key={i} className="flex-1 bg-primary/15 rounded-t relative" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} title={`${v} views`}>
                    <div className="absolute bottom-0 w-full bg-primary rounded-t" style={{ height: `${v > 0 ? Math.max(8, (v / max) * 100) : 0}%` }} />
                  </div>;
                })}
              </div>
              <p className="text-[10px] text-text-muted mb-3">Store views — last 14 days</p>
              {analytics.topProducts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Top viewed products</p>
                  <div className="space-y-1.5">
                    {analytics.topProducts.slice(0, 3).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        {p.image ? <img src={p.image} alt="" className="w-7 h-7 rounded object-cover" /> : <div className="w-7 h-7 rounded bg-surface" />}
                        <p className="text-xs text-text truncate flex-1">{p.name}</p>
                        <p className="text-xs font-semibold text-primary tabular-nums">{p.views} views</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text">Top Resellers This Month</h2>
            {board?.myRank && <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full">You: #{board.myRank}</span>}
          </div>
          {!board ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-surface rounded animate-pulse" />)}</div>
          ) : board.board?.length === 0 ? (
            <p className="text-sm text-text-muted py-6 text-center">No sales this month yet — be the first on the board!</p>
          ) : (
            <div className="space-y-1">
              {board.board.map((r: any) => (
                <div key={r.rank} className={`flex items-center gap-3 px-2.5 py-2 rounded-lg ${r.isYou ? "bg-primary/10 border border-primary/20" : ""}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${r.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-surface text-text-muted"}`}>{r.rank}</span>
                  <p className="text-sm text-text truncate flex-1">{r.storeName}{r.isYou && <span className="text-primary text-xs font-semibold ml-1">(you)</span>}</p>
                  <p className="text-sm font-semibold text-text tabular-nums">{formatPrice(r.commission)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
