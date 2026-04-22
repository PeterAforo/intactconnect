"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string; quantity: number; price: number; commission: number;
  product: { name: string; images: { url: string }[] };
}

interface Order {
  id: string; orderNumber: string; total: number; commission: number; status: string;
  shippingName: string | null; createdAt: string; items: OrderItem[];
  client: { name: string; phone: string } | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { color: "bg-blue-100 text-blue-700", icon: <Package className="w-3.5 h-3.5" /> },
  shipped: { color: "bg-indigo-100 text-indigo-700", icon: <Truck className="w-3.5 h-3.5" /> },
  delivered: { color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/dashboard/orders${params}`).then((r) => r.json()).then(setOrders).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Orders</h1>
          <p className="text-text-muted text-sm">{orders.length} orders total</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${filter === s ? "bg-primary text-white" : "bg-white border border-border text-text-muted hover:bg-surface"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            return (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl border border-border p-4 cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-bold text-text text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${sc.color}`}>
                      {sc.icon} {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-text">{order.shippingName || order.client?.name || "Unknown"}</p>
                      <p className="text-text-muted text-xs">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text text-sm">{formatPrice(order.total)}</p>
                      <p className="text-xs text-success">+{formatPrice(order.commission)}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
