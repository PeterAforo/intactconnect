"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Send, Eye, Package, Users, Mail, MessageCircle } from "lucide-react";

interface Product {
  id: string; name: string; price: number; resellerPrice: number;
  marginPercent: number; commissionPerUnit: number; image: string | null; category: { name: string } | null;
}
interface ProspectCount { total: number }

const MERGE_FIELDS = ["name", "business", "store", "link", "agent", "area"];

const TEMPLATES: { label: string; channel: "email" | "whatsapp" | "both"; body: string }[] = [
  {
    label: "Product offer intro",
    channel: "both",
    body: "Hi {{name}},\n\nI run {{store}} and we supply genuine Intact Ghana products at reseller prices — phones, laptops, accessories and more, delivered fast nationwide.\n\nYou keep a clear margin on every sale with zero stock risk. I'd love to show you what's possible for {{business}}.\n\nYour store: {{link}}\n\n— {{agent}}",
  },
  {
    label: "Become a stockist",
    channel: "both",
    body: "Hello {{name}},\n\n{{business}} could earn steady income reselling Intact products — we handle stock and delivery, you set your own prices and keep the margin.\n\nIt takes 10 minutes to get set up: {{link}}\n\nHappy to walk you through it anytime.\n\n{{agent}}",
  },
  {
    label: "Weekend flash offer",
    channel: "both",
    body: "Hi {{name}}! ⚡ Weekend deal inside: premium electronics at wholesale rates, only while stock lasts.\n\nSee the full catalog and your margin here: {{link}}\n\n— {{store}}",
  },
];

function CampaignBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetProspects = searchParams.get("prospects")?.split(",").filter(Boolean) || null;

  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"email" | "whatsapp" | "both">("both");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ area: "", status: "all", hasPhone: true, hasEmail: false });
  const [scheduledAt, setScheduledAt] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/products").then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : d.products || [])).catch(() => {});
    // estimate audience size
    fetch("/api/dashboard/prospects").then((r) => r.json()).then((d) => setAudienceCount(d.total ?? null)).catch(() => {});
  }, []);

  const sampleVars: Record<string, string> = {
    name: "Ama Serwaa", business: "Serwaa Enterprises", store: "Ama's Store",
    link: "https://www.intactconnect.com.gh/store/ama", agent: "Ama's Store", area: "Osu, Accra",
  };
  const previewBody = useMemo(() => {
    let out = body;
    for (const [k, v] of Object.entries(sampleVars)) out = out.replaceAll(`{{${k}}}`, v);
    return out;
  }, [body]);

  const toggleProduct = (id: string) => {
    setSelectedProducts((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const submit = async (sendNow: boolean) => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/dashboard/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Untitled campaign",
          channel,
          subject: channel === "whatsapp" ? undefined : subject || undefined,
          body,
          productIds: [...selectedProducts],
          prospectIds: presetProspects || undefined,
          filters: presetProspects ? undefined : {
            area: filters.area || undefined,
            status: filters.status,
            hasPhone: filters.hasPhone,
            hasEmail: filters.hasEmail,
          },
          scheduledAt: scheduledAt || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to create campaign");
      if (sendNow) {
        const sres = await fetch(`/api/dashboard/campaigns/${d.id}/send`, { method: "POST" });
        const sd = await sres.json();
        if (!sres.ok) throw new Error(sd.error || "Send failed");
        alert(`Campaign sent: ${sd.sent} delivered${sd.failed ? `, ${sd.failed} failed` : ""}${sd.whatsappQueue?.length ? `, ${sd.whatsappQueue.length} WhatsApp queued` : ""}`);
      }
      router.push(`/dashboard/campaigns/${d.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setSaving(false);
    }
  };

  return (
    <div className="px-5 sm:px-7 py-6 w-full max-w-5xl">
      <Link href="/dashboard/campaigns" className="inline-flex items-center gap-1.5 text-[13px] text-[#8a857c] hover:text-[#1c1917] mb-4">
        <ArrowLeft className="w-4 h-4" /> Campaigns
      </Link>
      <h1 className="text-[22px] font-bold tracking-tight text-[#1c1917] mb-1">New campaign</h1>
      <p className="text-[13px] text-[#8a857c] mb-6">Reach prospects by email and WhatsApp.</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-[13px] mb-4">{error}</div>}
      {presetProspects && <div className="bg-[#eef2fa] border border-[#d7e0f2] text-[#3f5f8a] rounded-xl px-4 py-2.5 text-[13px] mb-4">Audience: {presetProspects.length} hand-picked prospect{presetProspects.length > 1 ? "s" : ""}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5">
          {/* Basics */}
          <div className="bg-white rounded-xl border border-black/[0.05] p-5 space-y-4">
            <div>
              <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Campaign name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekend Flash — Phones" className="w-full h-10 px-3 rounded-lg border border-[#e2e0da] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Channel</label>
              <div className="flex gap-2">
                {([["email", Mail, "Email"], ["whatsapp", MessageCircle, "WhatsApp"], ["both", Send, "Both"]] as const).map(([v, Icon, label]) => (
                  <button key={v} onClick={() => setChannel(v)} className={`h-9 px-4 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 border transition-colors ${channel === v ? "bg-[#0d0b09] text-white border-[#0d0b09]" : "bg-white text-[#6b665e] border-black/[0.1] hover:border-black/[0.2]"}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>
            {channel !== "whatsapp" && (
              <div>
                <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Email subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Wholesale prices inside" className="w-full h-10 px-3 rounded-lg border border-[#e2e0da] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15" />
              </div>
            )}
          </div>

          {/* Audience */}
          {!presetProspects && (
            <div className="bg-white rounded-xl border border-black/[0.05] p-5">
              <h2 className="text-[14px] font-semibold text-[#1c1917] mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Audience</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Area contains</label>
                  <input value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })} placeholder="e.g. Accra" className="w-full h-10 px-3 rounded-lg border border-[#e2e0da] text-[13px]" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Pipeline status</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-[#e2e0da] text-[13px] bg-white">
                    <option value="all">All active</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="negotiating">Negotiating</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-[13px] text-[#3a362f] cursor-pointer">
                  <input type="checkbox" checked={filters.hasPhone} onChange={(e) => setFilters({ ...filters, hasPhone: e.target.checked })} className="accent-[#0d0b09]" /> Has phone (WhatsApp)
                </label>
                <label className="flex items-center gap-2 text-[13px] text-[#3a362f] cursor-pointer">
                  <input type="checkbox" checked={filters.hasEmail} onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })} className="accent-[#0d0b09]" /> Has email
                </label>
              </div>
              <p className="text-[12px] text-[#8a857c] mt-3">{audienceCount ?? "…"} total prospects in your pipeline. Recipients are created only for prospects reachable on the selected channel.</p>
            </div>
          )}

          {/* Template */}
          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-[14px] font-semibold text-[#1c1917]">Message</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {MERGE_FIELDS.map((f) => (
                  <button key={f} onClick={() => setBody((b) => b + ` {{${f}}}`)} className="h-6 px-2 rounded-full bg-[#f0efec] hover:bg-[#e6e4df] text-[11px] font-mono text-[#3a362f]" title={`Insert ${f}`}>{`{{${f}}}`}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => { setBody(t.body); if (t.channel !== "both") setChannel(t.channel); }} className="h-7 px-2.5 rounded-full bg-[#faf9f7] hover:bg-[#f0efec] text-[11px] font-medium text-[#6b665e]">
                  {t.label}
                </button>
              ))}
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e0da] text-[13px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15 resize-y" />
          </div>

          {/* Product offers */}
          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <h2 className="text-[14px] font-semibold text-[#1c1917] mb-1 flex items-center gap-2"><Package className="w-4 h-4" /> Featured offers <span className="text-[11px] font-normal text-[#a8a29a]">(optional — shown in email)</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 max-h-56 overflow-y-auto">
              {products.slice(0, 24).map((p) => (
                <button key={p.id} onClick={() => toggleProduct(p.id)}
                  className={`text-left rounded-lg border p-2.5 transition-colors ${selectedProducts.has(p.id) ? "border-[#0d0b09] bg-[#0d0b09]/[0.03]" : "border-black/[0.07] hover:border-black/[0.15]"}`}>
                  <p className="text-[12px] font-medium text-[#1c1917] truncate">{p.name}</p>
                  <p className="text-[11px] text-[#8a857c] mt-0.5">You earn {p.commissionPerUnit ? `+GH₵${p.commissionPerUnit}` : "—"}/unit</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview + schedule */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <button onClick={() => setPreview((v) => !v)} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1c1917] mb-3">
              <Eye className="w-4 h-4" /> {preview ? "Hide" : "Show"} preview
            </button>
            {preview && (
              <div className="rounded-lg border border-black/[0.07] bg-[#faf9f7] p-4 max-h-80 overflow-y-auto">
                <p className="text-[11px] text-[#a8a29a] mb-2">Sample merge: Ama Serwaa · Serwaa Enterprises · Osu, Accra</p>
                <p className="text-[13px] text-[#1c1917] whitespace-pre-wrap leading-relaxed">{previewBody}</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <label className="text-[12px] font-medium text-[#6b665e] block mb-1.5">Schedule (optional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#e2e0da] text-[13px]" />
            <p className="text-[11px] text-[#a8a29a] mt-1.5">Leave empty to send immediately. Scheduled campaigns send automatically via hourly cron.</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => submit(true)} disabled={saving || !body.trim()} className="h-11 rounded-xl bg-[#0d0b09] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#2a251d] disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Create & send now
            </button>
            <button onClick={() => submit(false)} disabled={saving || !body.trim()} className="h-11 rounded-xl border border-black/[0.12] text-[#1c1917] text-[13px] font-semibold hover:bg-[#f5f4f1] disabled:opacity-50">
              Save as draft
            </button>
          </div>
          <p className="text-[11px] text-[#a8a29a] leading-relaxed px-1">
            WhatsApp sends are queued as one-tap wa.me links (WhatsApp Business API not yet connected). Email sends include an unsubscribe note — keep messages honest and relevant.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="px-5 sm:px-7 py-6"><div className="h-40 bg-[#f5f4f1] rounded-xl animate-pulse" /></div>}>
      <CampaignBuilder />
    </Suspense>
  );
}
