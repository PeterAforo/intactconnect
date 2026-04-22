"use client";

import React, { useEffect, useState } from "react";
import { Settings, Loader2, Save, Copy, Check, Upload, Image as ImageIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserInfo {
  user: { id: string; name: string; email: string };
  reseller: {
    id: string; storeName: string; storeSlug: string; bio: string | null; phone: string; email: string;
    storeLogo: string | null; storeBanner: string | null; storeTagline: string | null; storeThemeColor: string | null;
    momoProvider: string | null; momoNumber: string | null; bankName: string | null; bankAccountNumber: string | null; bankAccountName: string | null;
  };
}

export default function SettingsPage() {
  const [data, setData] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState("");
  const [form, setForm] = useState({ storeName: "", bio: "", storeTagline: "", storeThemeColor: "", storeLogo: "", storeBanner: "", phone: "", email: "" });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setData(d);
      if (d?.reseller) setForm({
        storeName: d.reseller.storeName || "", bio: d.reseller.bio || "",
        storeTagline: d.reseller.storeTagline || "", storeThemeColor: d.reseller.storeThemeColor || "",
        storeLogo: d.reseller.storeLogo || "", storeBanner: d.reseller.storeBanner || "",
        phone: d.reseller.phone || "", email: d.reseller.email || "",
      });
    }).finally(() => setLoading(false));
  }, []);

  const storeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/store/${data?.reseller?.storeSlug || ""}`;
  const copyUrl = () => { navigator.clipboard.writeText(storeUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const doUpload = async (file: File, field: string) => {
    setUploading(field);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "intactconnect/store");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      if (r.ok) { const d = await r.json(); sf(field, d.url); }
    } catch { /* ignore */ }
    setUploading("");
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/dashboard/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-4 lg:p-8 flex items-center justify-center min-h-[50vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Settings</h1>
          <p className="text-text-muted text-sm">Manage your store settings and customization</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : saved ? <Check className="w-4 h-4 mr-1 text-success" /> : <Save className="w-4 h-4 mr-1" />}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
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
        </div>

        {/* Store Customization */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text mb-4">Store Customization</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text block mb-1">Store Name</label>
              <Input value={form.storeName} onChange={e => sf("storeName", e.target.value)} placeholder="Your Store Name" />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1">Tagline</label>
              <Input value={form.storeTagline} onChange={e => sf("storeTagline", e.target.value)} placeholder="Short tagline shown on your store" />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1">Bio / Description</label>
              <textarea value={form.bio} onChange={e => sf("bio", e.target.value)} rows={3} placeholder="Tell customers about your store..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1">Store Logo</label>
                <div className="flex items-center gap-3">
                  {form.storeLogo && <img src={form.storeLogo} alt="Logo" className="w-12 h-12 rounded-full object-cover border border-border" />}
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm cursor-pointer hover:border-primary/40 ${uploading === "storeLogo" ? "opacity-50" : ""}`}>
                    <Upload className="w-4 h-4 text-text-muted" />{form.storeLogo ? "Change" : "Upload"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) doUpload(e.target.files[0], "storeLogo"); }} />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1">Banner Image</label>
                <div className="flex items-center gap-3">
                  {form.storeBanner && <img src={form.storeBanner} alt="Banner" className="w-20 h-12 rounded object-cover border border-border" />}
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm cursor-pointer hover:border-primary/40 ${uploading === "storeBanner" ? "opacity-50" : ""}`}>
                    <ImageIcon className="w-4 h-4 text-text-muted" />{form.storeBanner ? "Change" : "Upload"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) doUpload(e.target.files[0], "storeBanner"); }} />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1 flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Theme Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.storeThemeColor || "#7c3aed"} onChange={e => sf("storeThemeColor", e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.storeThemeColor} onChange={e => sf("storeThemeColor", e.target.value)} placeholder="#7c3aed" className="w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text mb-3">Contact Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-text block mb-1">Phone</label><Input value={form.phone} onChange={e => sf("phone", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-text block mb-1">Email</label><Input value={form.email} onChange={e => sf("email", e.target.value)} type="email" /></div>
          </div>
        </div>

        {/* Profile (read-only) */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text mb-3">Account</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-text-muted block text-xs mb-0.5">Name</span><span className="text-text font-medium">{data?.user?.name}</span></div>
            <div><span className="text-text-muted block text-xs mb-0.5">Login Email</span><span className="text-text font-medium">{data?.user?.email}</span></div>
          </div>
        </div>

        {/* Payout */}
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
