"use client";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
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
    </div>
  );
}
