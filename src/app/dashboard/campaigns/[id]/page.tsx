"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, Mail, MessageCircle, CheckCircle2, XCircle, Clock, Copy, Check } from "lucide-react";

interface Recipient {
  id: string; channel: string; destination: string; status: string; error: string | null; sentAt: string | null;
  prospect: { id: string; name: string; area: string | null; status: string } | null;
}
interface Campaign {
  id: string; name: string; channel: string; subject: string | null; body: string;
  status: string; createdAt: string; sentAt: string | null;
  recipients: Recipient[];
}

const R_STATUS: Record<string, { style: string; icon: React.ReactNode }> = {
  pending: { style: "bg-[#f0efec] text-[#6b665e]", icon: <Clock className="w-3 h-3" /> },
  sent: { style: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { style: "bg-red-50 text-red-600", icon: <XCircle className="w-3 h-3" /> },
  opened: { style: "bg-sky-50 text-sky-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  clicked: { style: "bg-violet-50 text-violet-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  replied: { style: "bg-emerald-50 text-emerald-800", icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>("");
  const [waLinks, setWaLinks] = useState<{ prospectId: string; name: string; link: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/dashboard/campaigns/${id}`).then((r) => r.json()).then((d) => {
      if (d.error) { router.push("/dashboard/campaigns"); return; }
      setC(d); setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!confirm(`Send "${c?.name}" to all pending recipients?`)) return;
    setSending(true); setResult("");
    const res = await fetch(`/api/dashboard/campaigns/${id}/send`, { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      setResult(`Done — ${d.sent} sent, ${d.failed} failed`);
      setWaLinks(d.whatsappQueue || []);
      load();
    } else setResult(d.error || "Send failed");
    setSending(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(null), 1500);
  };

  if (loading) return <div className="px-5 sm:px-7 py-6"><div className="h-40 bg-[#f5f4f1] rounded-xl animate-pulse" /></div>;
  if (!c) return null;

  const pending = c.recipients.filter((r) => r.status === "pending");
  const canSend = ["draft", "scheduled", "sending"].includes(c.status) && pending.length > 0;

  return (
    <div className="px-5 sm:px-7 py-6 w-full max-w-4xl">
      <Link href="/dashboard/campaigns" className="inline-flex items-center gap-1.5 text-[13px] text-[#8a857c] hover:text-[#1c1917] mb-4">
        <ArrowLeft className="w-4 h-4" /> Campaigns
      </Link>

      <div className="bg-white rounded-xl border border-black/[0.05] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[22px] font-bold tracking-tight text-[#1c1917]">{c.name}</h1>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f0efec] text-[#6b665e] capitalize">{c.status}</span>
            </div>
            <p className="text-[13px] text-[#8a857c] mt-1">
              {c.channel} · {c.recipients.length} recipients · created {new Date(c.createdAt).toLocaleDateString()}
              {c.sentAt && ` · sent ${new Date(c.sentAt).toLocaleDateString()}`}
            </p>
            {c.subject && <p className="text-[12px] text-[#6b665e] mt-1">Subject: {c.subject}</p>}
          </div>
          {canSend && (
            <button onClick={send} disabled={sending} className="h-10 px-5 rounded-full bg-[#0d0b09] text-white text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-[#2a251d] disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send campaign
            </button>
          )}
        </div>
        {result && <p className="text-[13px] text-[#3f5f8a] mt-3 bg-[#eef2fa] rounded-lg px-3 py-2">{result}</p>}
        <div className="mt-4 rounded-lg bg-[#faf9f7] border border-black/[0.05] p-4 max-h-48 overflow-y-auto">
          <p className="text-[11px] text-[#a8a29a] mb-1.5">Message</p>
          <p className="text-[13px] text-[#1c1917] whitespace-pre-wrap leading-relaxed">{c.body}</p>
        </div>
      </div>

      {/* WhatsApp queue */}
      {waLinks.length > 0 && (
        <div className="mt-4 bg-emerald-50/60 border border-emerald-200 rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-emerald-900 mb-1">WhatsApp queue — {waLinks.length} messages</h2>
          <p className="text-[12px] text-emerald-800/80 mb-3">Tap each link to open WhatsApp with the message pre-filled, then press send.</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {waLinks.map((w) => (
              <div key={w.prospectId} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                <span className="text-[13px] font-medium text-[#1c1917] flex-1 truncate">{w.name}</span>
                <button onClick={() => copy(w.link, w.prospectId)} className="h-7 px-2.5 rounded-md bg-[#f0efec] text-[11px] font-medium text-[#3a362f] inline-flex items-center gap-1">
                  {copied === w.prospectId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === w.prospectId ? "Copied" : "Copy link"}
                </button>
                <a href={w.link} target="_blank" rel="noreferrer" className="h-7 px-3 rounded-md bg-emerald-600 text-white text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-emerald-700">
                  <MessageCircle className="w-3 h-3" /> Open
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipients */}
      <div className="mt-4 bg-white rounded-xl border border-black/[0.05] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/[0.05] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#1c1917]">Recipients</h2>
          <span className="text-[12px] text-[#8a857c]">{c.recipients.filter((r) => r.status === "sent" || r.status === "opened" || r.status === "clicked" || r.status === "replied").length} delivered</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-black/[0.05] text-[11px] uppercase tracking-wide text-[#a8a29a]">
                <th className="px-5 py-3 font-medium">Prospect</th>
                <th className="px-3 py-3 font-medium">Channel</th>
                <th className="px-3 py-3 font-medium">Destination</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium text-right">Sent</th>
              </tr>
            </thead>
            <tbody>
              {c.recipients.map((r) => {
                const st = R_STATUS[r.status] || R_STATUS.pending;
                return (
                  <tr key={r.id} className="border-b border-black/[0.03] last:border-0 hover:bg-[#faf9f7]">
                    <td className="px-5 py-3">
                      {r.prospect ? (
                        <Link href={`/dashboard/prospects/${r.prospect.id}`} className="text-[13px] font-medium text-[#1c1917] hover:underline">{r.prospect.name}</Link>
                      ) : <span className="text-[13px] text-[#a8a29a]">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-[12px] text-[#6b665e] capitalize">
                        {r.channel === "email" ? <Mail className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}{r.channel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#6b665e] font-mono">{r.destination}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.style}`}>
                        {st.icon}{r.status}{r.error === "whatsapp_queue" ? " (queued)" : ""}
                      </span>
                      {r.error && r.error !== "whatsapp_queue" && <p className="text-[10px] text-red-500 mt-0.5 max-w-[200px] truncate" title={r.error}>{r.error}</p>}
                    </td>
                    <td className="px-3 py-3 text-right text-[12px] text-[#8a857c]">{r.sentAt ? new Date(r.sentAt).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
