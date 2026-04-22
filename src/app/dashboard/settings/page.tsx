"use client";

import React, { useEffect, useState } from "react";
import { Settings, Loader2, Save, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserInfo {
  user: { id: string; name: string; email: string };
  reseller: { id: string; storeName: string; storeSlug: string; bio: string | null; phone: string; email: string; momoProvider: string | null; momoNumber: string | null; bankName: string | null; bankAccountNumber: string | null; bankAccountName: string | null };
}

export default function SettingsPage() {
  const [data, setData] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const storeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/store/${data?.reseller?.storeSlug || ""}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Settings
        </h1>
        <p className="text-text-muted text-sm">Manage your store settings and payout details</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Store Link */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text mb-3">Store Link</h2>
          <div className="flex items-center gap-2">
            <Input value={storeUrl} readOnly className="bg-surface text-sm font-mono" />
            <Button variant="outline" size="sm" onClick={copyUrl}>
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2">Share this link with your customers to start selling</p>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text mb-3">Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-text-muted block text-xs mb-0.5">Name</span><span className="text-text font-medium">{data?.user?.name}</span></div>
            <div><span className="text-text-muted block text-xs mb-0.5">Email</span><span className="text-text font-medium">{data?.user?.email}</span></div>
            <div><span className="text-text-muted block text-xs mb-0.5">Store Name</span><span className="text-text font-medium">{data?.reseller?.storeName}</span></div>
            <div><span className="text-text-muted block text-xs mb-0.5">Phone</span><span className="text-text font-medium">{data?.reseller?.phone}</span></div>
          </div>
        </div>

        {/* Payout Details */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text mb-3">Payout Details</h2>
          <div className="space-y-3 text-sm">
            {data?.reseller?.momoProvider && (
              <div className="bg-surface rounded-lg p-3">
                <span className="text-text-muted text-xs block mb-0.5">Mobile Money</span>
                <span className="text-text font-medium capitalize">{data.reseller.momoProvider} — {data.reseller.momoNumber}</span>
              </div>
            )}
            {data?.reseller?.bankName && (
              <div className="bg-surface rounded-lg p-3">
                <span className="text-text-muted text-xs block mb-0.5">Bank Account</span>
                <span className="text-text font-medium">{data.reseller.bankName} — {data.reseller.bankAccountNumber} ({data.reseller.bankAccountName})</span>
              </div>
            )}
            {!data?.reseller?.momoProvider && !data?.reseller?.bankName && (
              <p className="text-text-muted text-sm">No payout details configured. Contact support to update.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
