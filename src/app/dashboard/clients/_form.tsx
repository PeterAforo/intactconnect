"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, Navigation, Loader2, MapPin, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { blankForm, REGIONS, ID_TYPES, type ClientForm } from "./_types";

interface Props {
  initial?: ClientForm;
  clientId?: string;
  title: string;
}

export default function ClientFormPage({ initial, clientId, title }: Props) {
  const router = useRouter();
  const [fm, setFm] = useState<ClientForm>(initial || blankForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const isEdit = !!clientId;

  const sf = (k: string, v: string | number | null) => setFm(f => ({ ...f, [k]: v } as ClientForm));
  const isCo = fm.clientType === "company";

  const doUpload = async (file: File, field: string) => {
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "intactconnect/clients");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      if (r.ok) { const d = await r.json(); sf(field, d.url); }
    } catch { /* ignore */ }
    setUploading("");
  };

  const getGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        sf("latitude", pos.coords.latitude);
        sf("longitude", pos.coords.longitude);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const d = await r.json();
          if (d.address) {
            sf("city", d.address.city || d.address.town || d.address.village || "");
            sf("address", (d.display_name || "").split(",").slice(0, 3).join(", "));
            sf("region", d.address.state || "");
          }
        } catch { /* ignore */ }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fm.name.trim()) return;
    setSaving(true);
    const url = isEdit ? `/api/dashboard/clients/${clientId}` : "/api/dashboard/clients";
    await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fm),
    });
    setSaving(false);
    router.push("/dashboard/clients");
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.push("/dashboard/clients")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>
      <h1 className="text-2xl font-bold text-text mb-6">{title}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Toggle */}
        <div className="flex gap-2">
          {(["individual", "company"] as const).map(t => (
            <button key={t} type="button" onClick={() => sf("clientType", t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border transition-colors
                ${fm.clientType === t ? "bg-primary text-white border-primary" : "bg-white border-border text-text-muted hover:border-primary/30"}`}>
              {t === "individual" ? <><Users className="w-4 h-4" /> Individual</> : <><Building2 className="w-4 h-4" /> Company</>}
            </button>
          ))}
        </div>

        {/* Basic Info */}
        <fieldset className="bg-white rounded-xl border border-border p-4">
          <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-1">Basic Info</legend>
          <div className="space-y-3">
            <Input value={fm.name} onChange={e => sf("name", e.target.value)} placeholder={isCo ? "Company / Display Name *" : "Full Name *"} required />
            <div className="grid grid-cols-2 gap-3">
              <Input value={fm.email} onChange={e => sf("email", e.target.value)} placeholder="Email" type="email" />
              <Input value={fm.phone} onChange={e => sf("phone", e.target.value)} placeholder="Phone" />
            </div>
          </div>
        </fieldset>

        {/* Location */}
        <fieldset className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide px-1">Location</legend>
            <Button type="button" variant="outline" size="sm" onClick={getGPS} disabled={gpsLoading} className="h-7 text-xs">
              {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Navigation className="w-3 h-3 mr-1" />} Set GPS Location
            </Button>
          </div>
          <div className="space-y-3">
            <Input value={fm.address} onChange={e => sf("address", e.target.value)} placeholder="Street Address" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={fm.digitalAddress} onChange={e => sf("digitalAddress", e.target.value)} placeholder="Digital Address (GA-XXX-XXXX)" />
              <Input value={fm.landmark} onChange={e => sf("landmark", e.target.value)} placeholder="Nearby Landmark" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input value={fm.city} onChange={e => sf("city", e.target.value)} placeholder="City / Town" />
              <select value={fm.region} onChange={e => sf("region", e.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm">
                <option value="">Region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {fm.latitude && fm.longitude && (
              <p className="text-xs text-success flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS: {fm.latitude.toFixed(4)}, {fm.longitude.toFixed(4)}</p>
            )}
          </div>
        </fieldset>

        {/* Company or Individual specific */}
        {isCo ? (
          <>
            <fieldset className="bg-white rounded-xl border border-border p-4">
              <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-1">Company Details</legend>
              <div className="space-y-3">
                <Input value={fm.companyName} onChange={e => sf("companyName", e.target.value)} placeholder="Registered Company Name" />
                <div className="grid grid-cols-2 gap-3">
                  <Input value={fm.companyRegNumber} onChange={e => sf("companyRegNumber", e.target.value)} placeholder="Registration Number" />
                  <Input value={fm.taxId} onChange={e => sf("taxId", e.target.value)} placeholder="TIN / VAT Number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm cursor-pointer hover:border-primary/40 ${uploading === "companyDocUrl" ? "opacity-50" : ""}`}>
                    <Upload className="w-4 h-4 text-text-muted" />{fm.companyDocUrl ? "Cert ✓" : "Reg. Certificate"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) doUpload(e.target.files[0], "companyDocUrl"); }} />
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm cursor-pointer hover:border-primary/40 ${uploading === "companyTaxDocUrl" ? "opacity-50" : ""}`}>
                    <Upload className="w-4 h-4 text-text-muted" />{fm.companyTaxDocUrl ? "TIN ✓" : "TIN Certificate"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) doUpload(e.target.files[0], "companyTaxDocUrl"); }} />
                  </label>
                </div>
              </div>
            </fieldset>
            <fieldset className="bg-white rounded-xl border border-border p-4">
              <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-1">Contact Person</legend>
              <div className="space-y-3">
                <Input value={fm.contactPersonName} onChange={e => sf("contactPersonName", e.target.value)} placeholder="Contact Person Name" />
                <div className="grid grid-cols-2 gap-3">
                  <Input value={fm.contactPersonEmail} onChange={e => sf("contactPersonEmail", e.target.value)} placeholder="Contact Email" type="email" />
                  <Input value={fm.contactPersonPhone} onChange={e => sf("contactPersonPhone", e.target.value)} placeholder="Contact Phone" />
                </div>
              </div>
            </fieldset>
          </>
        ) : (
          <fieldset className="bg-white rounded-xl border border-border p-4">
            <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-1">Ghana National ID</legend>
            <div className="space-y-3">
              <select value={fm.nationalIdType} onChange={e => sf("nationalIdType", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                <option value="">Select ID Type</option>
                {ID_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
              <Input value={fm.nationalIdNumber} onChange={e => sf("nationalIdNumber", e.target.value)} placeholder="ID Number" />
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm cursor-pointer hover:border-primary/40 ${uploading === "nationalIdImage" ? "opacity-50" : ""}`}>
                <Upload className="w-4 h-4 text-text-muted" />{fm.nationalIdImage ? "ID uploaded ✓" : "Upload ID Image"}
                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) doUpload(e.target.files[0], "nationalIdImage"); }} />
              </label>
            </div>
          </fieldset>
        )}

        {/* Notes */}
        <fieldset className="bg-white rounded-xl border border-border p-4">
          <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-1">Notes</legend>
          <textarea value={fm.notes} onChange={e => sf("notes", e.target.value)} rows={2} placeholder="Any additional notes..." className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none" />
        </fieldset>

        <Button type="submit" className="w-full rounded-full h-11" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {isEdit ? "Update Client" : "Save Client"}
        </Button>
      </form>
    </div>
  );
}
