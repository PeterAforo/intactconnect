"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Copy, Check, MessageCircle, QrCode, Download, Store, Users, Wallet, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import QRCode from "qrcode";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const CAPTIONS = [
  "Genuine Intact Ghana products, delivered to your door. Shop my store:",
  "Phones, laptops & more — straight from Intact Ghana. Order through me:",
  "Skip the mall. Original electronics with warranty, delivered. My store:",
];

export default function SharePage() {
  const [data, setData] = useState<Any>(null);
  const [stats, setStats] = useState<Any>(null);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/dashboard/stats").then((r) => r.json()),
    ]).then(([me, s]) => {
      setData(me);
      setStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const slug = data?.reseller?.storeSlug || "";
  const storeUrl = `https://www.intactconnect.com.gh/store/${slug}`;
  const referralUrl = `https://www.intactconnect.com.gh/register?ref=${stats?.referralCode || ""}`;

  useEffect(() => {
    if (!slug) return;
    QRCode.toDataURL(storeUrl, { width: 800, margin: 2, color: { dark: "#1e293b", light: "#ffffff" } })
      .then(setQr).catch(() => {});
  }, [slug, storeUrl]);

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadQr = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${slug}-store-qr.png`;
    a.click();
  };

  const waText = (caption: string) => `https://wa.me/?text=${encodeURIComponent(`${caption}\n${storeUrl}`)}`;

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Share & Earn</h1>
        <p className="text-text-muted text-sm">Your store link, QR code, and ready-made captions — plus invite other resellers.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Store link card */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-text">Your store link</h2>
          </div>
          <div className="bg-surface rounded-lg px-3 py-2.5 flex items-center gap-2 mb-3">
            <p className="text-xs text-text font-mono truncate flex-1">{storeUrl}</p>
            <button onClick={() => copy("link", storeUrl)} className="text-primary shrink-0">
              {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => copy("link", storeUrl)} variant="outline" size="sm" className="rounded-lg flex-1">
              {copied === "link" ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />} Copy
            </Button>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" size="sm" className="w-full rounded-lg">
                <ExternalLink className="w-4 h-4 mr-1" /> View store
              </Button>
            </a>
          </div>
        </div>

        {/* QR card */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-text">Store QR code</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-surface overflow-hidden shrink-0 relative">
              {qr && <Image src={qr} alt="Store QR code" fill className="object-contain p-1" />}
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-3">Print it on flyers, stickers, or drop it in your WhatsApp status — scans straight to your store.</p>
              <Button onClick={downloadQr} size="sm" className="rounded-lg gap-1.5">
                <Download className="w-4 h-4" /> Download PNG
              </Button>
            </div>
          </div>
        </div>

        {/* Captions card */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-text">Ready-made captions</h2>
          </div>
          <div className="space-y-2">
            {CAPTIONS.map((c, i) => (
              <div key={i} className="flex items-start gap-2 bg-surface rounded-lg p-3">
                <p className="text-xs text-text flex-1 leading-relaxed">{c}</p>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => copy(`cap-${i}`, `${c} ${storeUrl}`)} className="text-primary hover:text-primary-light">
                    {copied === `cap-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a href={waText(c)} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:opacity-80">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            <h2 className="font-semibold">Invite resellers, earn GH₵25</h2>
          </div>
          <p className="text-white/70 text-xs mb-3 leading-relaxed">
            Share your referral link — when a reseller you invited makes their first sale, you earn GH₵25.
          </p>
          <div className="bg-white/10 rounded-lg px-3 py-2.5 flex items-center gap-2 mb-4">
            <p className="text-xs font-mono truncate flex-1 text-white/90">{referralUrl}</p>
            <button onClick={() => copy("ref", referralUrl)} className="text-white shrink-0">
              {copied === "ref" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-4 text-center">
            <div className="flex-1 bg-white/10 rounded-lg py-2.5">
              <p className="text-xl font-bold tabular-nums">{stats?.referralCount ?? 0}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Invited</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-lg py-2.5">
              <p className="text-xl font-bold tabular-nums">{formatPrice(stats?.referralBonusPaid ?? 0)}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Bonus earned</p>
            </div>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Join IntactConnect and earn commissions selling Intact Ghana products:\n${referralUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex-1">
              <div className="bg-[#25D366] rounded-lg py-2.5 h-full flex items-center justify-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">Share</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
