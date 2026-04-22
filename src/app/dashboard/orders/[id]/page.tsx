"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, Clock, Truck, CheckCircle, XCircle, MapPin, Phone, User } from "lucide-react";
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
  client: { name: string; phone: string; email: string | null } | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  processing: { color: "bg-blue-100 text-blue-700", icon: <Package className="w-4 h-4" />, label: "Processing" },
  shipped: { color: "bg-indigo-100 text-indigo-700", icon: <Truck className="w-4 h-4" />, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" />, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" />, label: "Cancelled" },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/orders/${id}`).then(r => r.json()).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!order) return <div className="p-8 text-center text-text-muted">Order not found</div>;

  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.push("/dashboard/orders")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text font-mono">{order.orderNumber}</h1>
          <p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${sc.color} flex items-center gap-1`}>
          {sc.icon} {sc.label}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Items */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <h3 className="px-4 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border bg-surface">Items</h3>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3">
                {item.product.images[0] && <img src={item.product.images[0].url} alt="" className="w-12 h-12 rounded-lg object-contain bg-surface" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{item.product.name}</p>
                  <p className="text-xs text-text-muted">x{item.quantity} @ {formatPrice(item.price)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-text">{formatPrice(item.price * item.quantity)}</p>
                  <p className="text-xs text-success">+{formatPrice(item.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-text-muted">Order Total</span><span className="font-bold text-text">{formatPrice(order.total)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-text-muted">Your Commission</span><span className="font-bold text-success">+{formatPrice(order.commission)}</span></div>
          {order.paymentMethod && (
            <div className="flex justify-between text-sm"><span className="text-text-muted">Payment</span><span className="text-text capitalize">{order.paymentMethod.replace(/_/g, " ")}</span></div>
          )}
        </div>

        {/* Customer & Shipping */}
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase mb-3">Customer & Shipping</h3>
          <div className="space-y-2 text-sm">
            {(order.shippingName || order.client?.name) && (
              <p className="flex items-center gap-2 text-text"><User className="w-4 h-4 text-text-muted" /> {order.shippingName || order.client?.name}</p>
            )}
            {(order.shippingPhone || order.client?.phone) && (
              <p className="flex items-center gap-2 text-text"><Phone className="w-4 h-4 text-text-muted" /> {order.shippingPhone || order.client?.phone}</p>
            )}
            {order.shippingAddress && (
              <p className="flex items-center gap-2 text-text"><MapPin className="w-4 h-4 text-text-muted" /> {order.shippingAddress}{order.shippingCity ? `, ${order.shippingCity}` : ""}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
