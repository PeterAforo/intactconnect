"use client";
import React from "react";
import { X, Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Client } from "./_types";

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-lg p-3">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{t}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function IR({ l, v }: { l: string; v: string | null | undefined }) {
  if (!v) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-muted">{l}</span>
      <span className="text-text font-medium text-right max-w-[60%] truncate">{v}</span>
    </div>
  );
}

export default function ClientDetail({ client: c, onClose }: { client: Client; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${c.clientType === "company" ? "bg-blue-100 text-blue-700" : "bg-primary/10 text-primary"}`}>
              {c.clientType === "company" ? <Building2 className="w-5 h-5" /> : c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-text">{c.name}</h2>
              <Badge className="text-[10px]">{c.clientType}</Badge>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>

        <div className="p-4 space-y-4">
          <Sec t="Contact">
            <IR l="Phone" v={c.phone} />
            <IR l="Email" v={c.email} />
          </Sec>

          <Sec t="Location">
            <IR l="Address" v={c.address} />
            <IR l="Digital Address" v={c.digitalAddress} />
            <IR l="City" v={c.city} />
            <IR l="Region" v={c.region} />
            <IR l="Landmark" v={c.landmark} />
            {c.latitude && c.longitude && (
              <>
                <IR l="GPS" v={`${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`} />
                <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer"
                  className="text-primary text-xs hover:underline inline-flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> Open in Google Maps
                </a>
              </>
            )}
          </Sec>

          {c.clientType === "company" ? (
            <Sec t="Company Details">
              <IR l="Company" v={c.companyName} />
              <IR l="Reg. No." v={c.companyRegNumber} />
              <IR l="TIN" v={c.taxId} />
              <IR l="Contact Person" v={c.contactPersonName} />
              <IR l="Contact Email" v={c.contactPersonEmail} />
              <IR l="Contact Phone" v={c.contactPersonPhone} />
            </Sec>
          ) : (
            <Sec t="Identification">
              <IR l="ID Type" v={c.nationalIdType?.replace(/_/g, " ")} />
              <IR l="ID Number" v={c.nationalIdNumber} />
            </Sec>
          )}

          {c.notes && <Sec t="Notes"><p className="text-sm text-text-muted">{c.notes}</p></Sec>}

          <Sec t="Activity">
            <IR l="Orders" v={String(c._count.orders)} />
            <IR l="Invoices" v={String(c._count.invoices)} />
            <IR l="Added" v={new Date(c.createdAt).toLocaleDateString()} />
          </Sec>
        </div>
      </div>
    </>
  );
}
