"use client";
import React, { useState } from "react";
import { X, Users, Building2, Navigation, Loader2, MapPin, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { blankForm, REGIONS, ID_TYPES, type ClientForm } from "./_types";

export default function AddClientModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [fm, setFm] = useState<ClientForm>(blankForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

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
    await fetch("/api/dashboard/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fm),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[560px] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="font-bold text-text text-lg">Add Client</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
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
          <fieldset>
            <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Basic Info</legend>
            <div className="space-y-3">
              <Input value={fm.name} onChange={e => sf("name", e.target.value)} placeholder={isCo ? "Company / Display Name *" : "Full Name *"} required />
              <div className="grid grid-cols-2 gap-3">
                <Input value={fm.email} onChange={e => sf("email", e.target.value)} placeholder="Email" type="email" />
                <Input value={fm.phone} onChange={e => sf("phone", e.target.value)} placeholder="Phone" />
              </div>
            </div>
          </fieldset>

          {/* Location */}
          <fieldset>
            <div className="flex items-center justify-between mb-2">
              <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide">Location</legend>
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
              <fieldset>
                <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Company Details</legend>
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
              <fieldset>
                <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Contact Person</legend>
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
            <fieldset>
              <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Ghana National ID</legend>
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
          <fieldset>
            <legend className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Notes</legend>
            <textarea value={fm.notes} onChange={e => sf("notes", e.target.value)} rows={2} placeholder="Any additional notes..." className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none" />
          </fieldset>

          <Button type="submit" className="w-full rounded-full h-11" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Client
          </Button>
        </form>
      </div>
    </>
  );
}
