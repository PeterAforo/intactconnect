"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, Mail, Globe, MapPin, MessageCircle, StickyNote,
  Loader2, UserCheck, Sparkles, Send, Calendar,
} from "lucide-react";

interface Activity { id: string; type: string; body: string | null; createdAt: string }
interface Prospect {
  id: string; name: string; type: string; category: string | null;
  phone: string | null; email: string | null; website: string | null;
  address: string | null; area: string | null; latitude: number | null; longitude: number | null;
  status: string; score: number; source: string | null; notes: string | null;
  clientId: string | null; createdAt: string;
  activities: Activity[];
  campaignRecipients: { id: string; channel: string; status: string; sentAt: string | null; campaign: { id: string; name: string; channel: string; status: string } }[];
}

const STATUSES = ["new", "contacted", "interested", "negotiating", "converted", "lost"];
const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#eef2fa] text-[#3f5f8a]",
  contacted: "bg-[#faf3e4] text-amber-700",
  interested: "bg-violet-50 text-violet-700",
  negotiating: "bg-sky-50 text-sky-700",
  converted: "bg-emerald-50 text-emerald-700",
  lost: "bg-red-50 text-red-600",
};
const ACTIVITY_ICON: Record<string, string> = {
  note: "📝", email_sent: "✉️", whatsapp_sent: "💬", status_change: "↔️",
  call: "📞", meeting: "🤝", system: "⚙️",
};

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch(`/api/dashboard/prospects/${id}`).then((r) => r.json()).then((d) => {
      if (d.error) { router.push("/dashboard/prospects"); return; }
      setP(d); setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/dashboard/prospects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const d = await res.json();
    if (res.ok) setP(d);
    return d;
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy("note");
    await fetch(`/api/dashboard/prospects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appendNote: note }),
    });
    setNote(""); setBusy(""); load();
  };

  const enrich = async () => {
    setBusy("enrich"); setMsg("");
    const res = await fetch(`/api/dashboard/prospects/${id}/enrich`, { method: "POST" });
    const d = await res.json();
    setMsg(d.email ? `Found email: ${d.email}` : (d.note || d.error || "No email found"));
    setBusy(""); load();
  };

  const convert = async () => {
    if (!confirm(`Convert "${p?.name}" to a client?`)) return;
    setBusy("convert");
    const res = await fetch(`/api/dashboard/prospects/${id}/convert`, { method: "POST" });
    const d = await res.json();
    if (res.ok) { setMsg("Converted to client!"); load(); }
    else setMsg(d.error || "Conversion failed");
    setBusy("");
  };

  const waLink = p?.phone ? `https://wa.me/${p.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${p.name}, this is regarding our products...`)}` : null;

  if (loading) return <div className="px-5 sm:px-7 py-6"><div className="h-40 bg-[#f5f4f1] rounded-xl animate-pulse" /></div>;
  if (!p) return null;

  return (
    <div className="px-5 sm:px-7 py-6 w-full max-w-4xl">
      <Link href="/dashboard/prospects" className="inline-flex items-center gap-1.5 text-[13px] text-[#8a857c] hover:text-[#1c1917] mb-4">
        <ArrowLeft className="w-4 h-4" /> Prospects
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-black/[0.05] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] font-bold tracking-tight text-[#1c1917]">{p.name}</h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[p.status]}`}>{p.status}</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#f0efec] text-[#6b665e]">score {p.score}</span>
              <span className="text-[11px] text-[#a8a29a] capitalize">{p.type}{p.category ? ` · ${p.category}` : ""}</span>
            </div>
            <p className="text-[12px] text-[#8a857c] mt-1.5">
              {[p.area, p.source ? `via ${p.source}` : null, `added ${new Date(p.createdAt).toLocaleDateString()}`].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="h-9 px-3.5 rounded-full bg-emerald-600 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-700">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} className="h-9 px-3.5 rounded-full bg-[#eef2fa] text-[#3f5f8a] text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#dfe7f7]">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            )}
            {!p.email && p.website && (
              <button onClick={enrich} disabled={busy === "enrich"} className="h-9 px-3.5 rounded-full bg-[#faf3e4] text-amber-700 text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#f5ebd3] disabled:opacity-50">
                {busy === "enrich" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Find email
              </button>
            )}
            {p.status !== "converted" && (
              <button onClick={convert} disabled={busy === "convert"} className="h-9 px-4 rounded-full bg-[#0d0b09] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#2a251d] disabled:opacity-50">
                {busy === "convert" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />} Convert to client
              </button>
            )}
          </div>
        </div>
        {msg && <p className="text-[12px] text-[#3f5f8a] mt-3 bg-[#eef2fa] rounded-lg px-3 py-2">{msg}</p>}

        {/* Status stepper */}
        <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1">
          {STATUSES.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => patch({ status: s })}
                className={`h-7 px-3 rounded-full text-[11px] font-medium whitespace-nowrap capitalize transition-colors ${p.status === s ? "bg-[#0d0b09] text-white" : "bg-[#f5f4f1] text-[#6b665e] hover:text-[#1c1917]"}`}
              >
                {s}
              </button>
              {i < STATUSES.length - 1 && <span className="text-[#d6d3d1] text-[10px]">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 mt-4">
        {/* Left — contact + notes */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <h2 className="text-[14px] font-semibold text-[#1c1917] mb-3">Contact details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Phone, label: "Phone", value: p.phone, href: p.phone ? `tel:${p.phone}` : null },
                { icon: Mail, label: "Email", value: p.email, href: p.email ? `mailto:${p.email}` : null },
                { icon: Globe, label: "Website", value: p.website, href: p.website ? (p.website.startsWith("http") ? p.website : `https://${p.website}`) : null, external: true },
                { icon: MapPin, label: "Area", value: p.area },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-3 rounded-lg bg-[#faf9f7] px-3.5 py-3">
                  <c.icon className="w-4 h-4 text-[#8a857c] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-[#a8a29a] font-medium">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} target={c.external ? "_blank" : undefined} rel="noreferrer" className="text-[13px] font-medium text-[#1c1917] hover:underline truncate block">{c.value}</a>
                    ) : (
                      <p className="text-[13px] font-medium text-[#1c1917] truncate">{c.value || "—"}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {p.address && <p className="text-[12px] text-[#8a857c] mt-3">📍 {p.address}</p>}
            {p.latitude && p.longitude && (
              <a href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=16/${p.latitude}/${p.longitude}`} target="_blank" rel="noreferrer" className="text-[12px] text-[#3f5f8a] hover:underline mt-1 inline-block">View on map →</a>
            )}
          </div>

          <div className="bg-white rounded-xl border border-black/[0.05] p-5">
            <h2 className="text-[14px] font-semibold text-[#1c1917] mb-3 flex items-center gap-2"><StickyNote className="w-4 h-4" /> Notes</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add a note about this prospect..."
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e0da] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15 resize-y"
            />
            <button onClick={addNote} disabled={busy === "note" || !note.trim()} className="mt-2 h-9 px-4 rounded-full bg-[#0d0b09] text-white text-[12px] font-semibold disabled:opacity-50">
              Save note
            </button>
            {p.notes && <p className="text-[12px] text-[#6b665e] mt-3 whitespace-pre-wrap bg-[#faf9f7] rounded-lg p-3">{p.notes}</p>}
          </div>
        </div>

        {/* Right — activity timeline */}
        <div className="bg-white rounded-xl border border-black/[0.05] p-5 self-start">
          <h2 className="text-[14px] font-semibold text-[#1c1917] mb-4">Activity</h2>
          {p.campaignRecipients.length > 0 && (
            <div className="mb-4 space-y-1.5">
              {p.campaignRecipients.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-[12px] text-[#6b665e] bg-[#faf9f7] rounded-lg px-3 py-2">
                  <Send className="w-3.5 h-3.5" />
                  <span className="flex-1 truncate">{r.campaign.name}</span>
                  <span className="capitalize">{r.channel}</span>
                  <span className={r.status === "sent" ? "text-emerald-700" : r.status === "failed" ? "text-red-600" : "text-amber-700"}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-0 max-h-[480px] overflow-y-auto pr-1">
            {p.activities.length === 0 ? (
              <p className="text-[12px] text-[#a8a29a] text-center py-6">No activity yet</p>
            ) : p.activities.map((a) => (
              <div key={a.id} className="flex gap-2.5 py-2 border-b border-black/[0.03] last:border-0">
                <span className="text-[13px]">{ACTIVITY_ICON[a.type] || "•"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-[#1c1917]">{a.body || a.type.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-[#a8a29a] flex items-center gap-1 mt-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
