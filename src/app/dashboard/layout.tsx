"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Users, FileText, Wallet,
  Store, Settings, LogOut, Menu, X, ChevronRight, Tag, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/payouts", label: "Payouts", icon: Wallet },
  { href: "/dashboard/promotions", label: "Promotions", icon: Megaphone },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface ResellerData {
  user: { id: string; name: string; email: string };
  reseller: { id: string; storeName: string; storeSlug: string; status: string; picture: string; commissionBalance: number } | null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = useState<ResellerData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.reseller || d.reseller.status !== "approved") {
        router.push("/login");
        return;
      }
      setData(d);
      setLoading(false);
    }).catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-white border-b border-border h-14 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5 text-text" />
        </button>
        <Image src="/img/logo.png" alt="IntactConnect" width={160} height={45} className="h-10 w-auto" />
        <div className="w-5" />
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <Link href="/dashboard"><Image src="/img/logo.png" alt="IntactConnect" width={180} height={50} className="h-12 w-auto" /></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Reseller Info */}
        {data?.reseller && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <img src={data.reseller.picture} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="font-medium text-text text-sm truncate">{data.reseller.storeName}</p>
                <p className="text-xs text-text-muted truncate">{data.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="p-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${active ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface hover:text-text"}`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Store Link + Logout */}
        <div className="p-3 border-t border-border space-y-2">
          {data?.reseller && (
            <Link href={`/store/${data.reseller.storeSlug}`} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
              <Store className="w-4 h-4" /> View My Store
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/5 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
