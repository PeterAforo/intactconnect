"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Megaphone, Plus, Mail, MessageCircle, Users, Send, Trash2, Loader2 } from "lucide-react";

interface Campaign {
  id: string; name: string; channel: string; status: string;
  subject: string | null; createdAt: string; sentAt: string | null;
  _count: { recipients: number };
  counts: { sent: number; failed: number; pending: number };
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-[#f0efec] text-[#6b665e]",
  scheduled: "bg-[#eef2fa] text-[#3f5f8a]",
  sending: "bg-[#faf3e4] text-amber-700",
  sent: "bg-emerald-50 text-emerald-700",
  paused: "bg-violet-50 text-violet-700",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    fetch("/api/dashboard/campaigns").then((r) => r.json()).then(setCampaigns).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    setDeleting(id);
    await fetch(`/api/dashboard/campaigns/${id}`, { method: "DELETE" });
    load(); setDeleting(null);
  };

  return (
    <div className="px-5 sm:px-7 py-6 w-full">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.05] flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[#1c1917]">Campaigns</h1>
          <p className="text-[13px] text-[#8a857c] mt-0.5">Reach your prospects by email and WhatsApp.</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="h-9 px-4 rounded-full bg-[#0d0b09] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#2a251d]">
          <Plus className="w-4 h-4" /> New campaign
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="mt-5 bg-white rounded-xl border border-black/[0.05] p-14 text-center">
          <Megaphone className="w-10 h-10 text-[#d6d3d1] mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-[#1c1917]">No campaigns yet</p>
          <p className="text-[13px] text-[#8a857c] mt-1 mb-5">Build your first outreach — offer products, share your store, win clients.</p>
          <Link href="/dashboard/campaigns/new" className="h-9 px-4 rounded-full bg-[#0d0b09] text-white text-[12px] font-semibold inline-flex">Create campaign</Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl border border-black/[0.05] p-4 flex items-center gap-4 hover:border-black/[0.12] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#f5f4f1] flex items-center justify-center shrink-0">
                {c.channel === "email" ? <Mail className="w-4.5 h-4.5 text-[#3f5f8a]" /> : c.channel === "whatsapp" ? <MessageCircle className="w-4.5 h-4.5 text-emerald-600" /> : <Send className="w-4.5 h-4.5 text-violet-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/campaigns/${c.id}`} className="text-[14px] font-semibold text-[#1c1917] hover:underline truncate block">{c.name}</Link>
                <p className="text-[12px] text-[#8a857c] mt-0.5">
                  {c._count.recipients} recipients · {new Date(c.createdAt).toLocaleDateString()}
                  {c.counts.sent > 0 && ` · ${c.counts.sent} sent`}
                  {c.counts.failed > 0 && ` · ${c.counts.failed} failed`}
                </p>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[c.status] || STATUS_STYLE.draft}`}>{c.status}</span>
              <Link href={`/dashboard/campaigns/${c.id}`} className="text-[12px] font-medium text-[#6b665e] hover:text-[#1c1917] hidden sm:block">View →</Link>
              {c.status !== "sent" && c.status !== "sending" && (
                <button onClick={() => remove(c.id)} disabled={deleting === c.id} className="text-[#a8a29a] hover:text-red-600 transition-colors" aria-label="Delete campaign">
                  {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
