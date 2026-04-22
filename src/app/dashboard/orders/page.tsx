"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string; quantity: number; price: number; commission: number;
  product: { name: string; images: { url: string }[] };
}

interface Order {
  id: string; orderNumber: string; total: number; commission: number; status: string;
  paymentMethod: string | null; paymentStatus: string;
  shippingName: string | null; shippingPhone: string | null; shippingAddress: string | null; shippingCity: string | null;
  createdAt: string; items: OrderItem[];
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
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
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-xl border border-border p-4 cursor-pointer hover:shadow-sm transition-shadow"
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
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedOrder(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[500px] sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-text text-lg">{selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-text-muted">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-text-muted hover:text-text text-xl">&times;</button>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-surface rounded-lg p-2.5">
                    {item.product.images[0] && <img src={item.product.images[0].url} alt="" className="w-10 h-10 rounded-lg object-contain bg-white" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{item.product.name}</p>
                      <p className="text-xs text-text-muted">x{item.quantity} @ {formatPrice(item.price)}</p>
                    </div>
                    <p className="text-sm font-bold text-text">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-3 mb-4 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Total</span><span className="font-bold text-text">{formatPrice(selectedOrder.total)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Commission</span><span className="font-bold text-success">+{formatPrice(selectedOrder.commission)}</span></div>
              </div>

              {/* Customer & Shipping */}
              <div className="bg-surface rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium text-text">{selectedOrder.shippingName}</p>
                <p className="text-text-muted">{selectedOrder.shippingPhone}</p>
                <p className="text-text-muted">{selectedOrder.shippingAddress}, {selectedOrder.shippingCity}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
