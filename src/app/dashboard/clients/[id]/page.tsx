"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Pencil, Trash2, Loader2, ShoppingCart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Client } from "../_types";

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function IR({ l, v }: { l: string; v: string | null | undefined }) {
  if (!v) return null;
  return <div className="flex justify-between text-sm"><span className="text-text-muted">{l}</span><span className="text-text font-medium text-right max-w-[60%]">{v}</span></div>;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/clients/${id}`).then(r => r.json()).then(setC).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/dashboard/clients/${id}`, { method: "DELETE" });
    if (r.ok) { router.push("/dashboard/clients"); }
    else { const d = await r.json(); alert(d.error || "Cannot delete"); setDeleting(false); setShowConfirm(false); }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!c) return <div className="p-8 text-center text-text-muted">Client not found</div>;

  const canDelete = c._count.orders === 0 && c._count.invoices === 0;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.push("/dashboard/clients")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${c.clientType === "company" ? "bg-blue-100 text-blue-700" : "bg-primary/10 text-primary"}`}>
            {c.clientType === "company" ? <Building2 className="w-6 h-6" /> : c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">{c.name}</h1>
            <Badge className="text-[10px]">{c.clientType}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/clients/${id}/edit`)}>
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
          {canDelete && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
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

      {/* Delete Confirmation */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 p-6 w-[360px]">
            <h3 className="font-bold text-text mb-2">Delete Client?</h3>
            <p className="text-sm text-text-muted mb-4">This action cannot be undone. Are you sure you want to delete <strong>{c.name}</strong>?</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
