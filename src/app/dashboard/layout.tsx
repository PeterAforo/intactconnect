"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Users, FileText, Wallet,
  Settings, LogOut, Menu, X, Megaphone, Package, Share2, LifeBuoy,
  Target, Send, Store, Check, ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/catalog", label: "Catalog", icon: Package },
  { href: "/dashboard/share", label: "Share & Earn", icon: Share2 },
  { href: "/dashboard/prospects", label: "Prospects", icon: Target },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Send },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/payouts", label: "Payouts", icon: Wallet },
  { href: "/dashboard/promotions", label: "Promotions", icon: Megaphone },
];

const BOTTOM_ITEMS = [
  { href: "https://wa.me/233543645126", label: "Support", icon: LifeBuoy, external: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface ResellerData {
  user: { id: string; name: string; email: string };
  reseller: { id: string; storeName: string; storeSlug: string; status: string; picture: string; commissionBalance: number } | null;
}

function SidebarContent({ data, pathname, onNavigate, onLogout }: {
  data: ResellerData;
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const initials = (data.reseller?.storeName || data.user.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Image src="/img/logo.png" alt="IntactConnect" width={150} height={42} className="h-10 w-auto" />
        </Link>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center px-4 pb-5">
        {data.reseller?.picture ? (
          <img src={data.reseller.picture} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-black/[0.06]" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#0d0b09] text-white flex items-center justify-center text-base font-bold">{initials}</div>
        )}
        <p className="mt-3 text-sm font-semibold text-[#1c1917] text-center truncate w-full">{data.reseller?.storeName || data.user.name}</p>
        <p className="text-xs text-[#8a857c] mt-0.5">Reseller</p>
      </div>

      <div className="mx-5 border-t border-black/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-white text-[#1c1917] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.07)]" : "text-[#6b665e] hover:text-[#1c1917] hover:bg-black/[0.03]"}`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Lower group */}
      <div className="px-3 pb-3 space-y-1">
        <div className="mx-1.5 border-t border-black/[0.06] mb-2" />
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[#6b665e] hover:text-[#1c1917] hover:bg-black/[0.03] transition-colors"
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[#b42318] hover:bg-red-50 transition-colors w-full text-left"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = useState<ResellerData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const sectionLabel = NAV_ITEMS.find((i) => i.href !== "/dashboard" && pathname.startsWith(i.href))?.label || "Overview";

  const copyStoreLink = async () => {
    const url = data?.reseller ? `https://www.intactconnect.com.gh/store/${data.reseller.storeSlug}` : window.location.origin;
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.reseller) { router.push("/login"); return; }
      if (d.reseller.status !== "approved") {
        router.push(d.reseller.status === "pending" ? "/pending" : "/login");
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
      <div className="min-h-screen flex items-center justify-center bg-[#efede8]">
        <div className="w-8 h-8 border-4 border-[#0d0b09] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-white flex overflow-hidden">
      <div className="flex flex-1 min-h-0 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-black/[0.06] h-14 flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5 text-[#1c1917]" />
          </button>
          <Image src="/img/logo.png" alt="IntactConnect" width={150} height={42} className="h-9 w-auto" />
          <div className="w-5" />
        </header>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed top-0 left-0 z-50 h-full w-[240px] bg-[#faf9f6] border-r border-black/[0.06] transform transition-transform lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4" aria-label="Close menu">
            <X className="w-5 h-5 text-[#8a857c]" />
          </button>
          <SidebarContent data={data!} pathname={pathname} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-56 xl:w-64 shrink-0 bg-[#faf9f6] border-r border-black/[0.06] flex-col">
          <SidebarContent data={data!} pathname={pathname} onLogout={handleLogout} />
        </aside>

        {/* Workspace */}
        <main className="flex-1 min-w-0 overflow-y-auto pt-14 lg:pt-0">
          {/* Top navbar — every section except Overview (which has its own greeting header) */}
          {pathname !== "/dashboard" && (
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-black/[0.05] px-5 sm:px-7 h-14 flex items-center justify-between gap-4">
              <h1 className="text-[15px] font-semibold text-[#1c1917] tracking-tight truncate">{sectionLabel}</h1>
              <div className="flex items-center gap-2">
                {data!.reseller && (
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#f0efec] hover:bg-[#e6e4df] text-[13px] font-medium text-[#3a362f] transition-colors"
                    >
                      <Store className="w-3.5 h-3.5" />
                      {data!.reseller!.storeName}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                        <div role="menu" className="absolute right-0 top-10 z-40 w-52 bg-white rounded-xl border border-black/[0.07] shadow-sm py-1.5">
                          {[
                            { label: "View public store", href: `https://www.intactconnect.com.gh/store/${data!.reseller!.storeSlug}`, external: true },
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
                  { icon: Store, onClick: () => window.open(data!.reseller ? `https://www.intactconnect.com.gh/store/${data!.reseller.storeSlug}` : "/dashboard", "_blank"), label: "View store" },
                  { icon: copied ? Check : Share2, onClick: copyStoreLink, label: copied ? "Link copied" : "Copy store link" },
                  { icon: Package, href: "/dashboard/catalog", label: "Catalog", external: false },
                  { icon: LifeBuoy, href: "https://wa.me/233543645126", label: "Support", external: true },
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
          )}
          <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
