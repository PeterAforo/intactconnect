"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ClientFormPage from "../../_form";
import type { ClientForm } from "../../_types";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<ClientForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/clients/${id}`).then(r => r.json()).then(d => {
      setInitial({
        clientType: d.clientType || "individual",
        name: d.name || "", email: d.email || "", phone: d.phone || "",
        address: d.address || "", digitalAddress: d.digitalAddress || "",
        city: d.city || "", region: d.region || "", landmark: d.landmark || "",
        latitude: d.latitude || null, longitude: d.longitude || null,
        nationalIdType: d.nationalIdType || "", nationalIdNumber: d.nationalIdNumber || "",
        nationalIdImage: d.nationalIdImage || "",
        companyName: d.companyName || "", companyRegNumber: d.companyRegNumber || "",
        taxId: d.taxId || "", companyDocUrl: d.companyDocUrl || "",
        companyTaxDocUrl: d.companyTaxDocUrl || "",
        contactPersonName: d.contactPersonName || "",
        contactPersonEmail: d.contactPersonEmail || "",
        contactPersonPhone: d.contactPersonPhone || "",
        notes: d.notes || "",
      });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!initial) return <div className="p-8 text-center text-text-muted">Client not found</div>;

  return <ClientFormPage initial={initial} clientId={id} title="Edit Client" />;
}
