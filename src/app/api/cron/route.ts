import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";
import { sendCampaign } from "@/lib/campaign-send";
import { unsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FOLLOW_UP_AFTER_DAYS = 3;
const MAX_FOLLOW_UPS_PER_RUN = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Vercel Cron entry point (see vercel.json).
 * 1. Sends campaigns whose scheduledAt has passed.
 * 2. Sends automated day-3+ follow-up emails to engaged prospects
 *    (contacted/interested/negotiating, not opted out, has email).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { campaignsSent: 0, campaignsFailed: 0, followUpsSent: 0, followUpsFailed: 0, errors: [] as string[] };

  // 1. Scheduled campaigns due now
  const dueCampaigns = await prisma.campaign.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    select: { id: true, name: true },
    take: 10,
  });
  for (const c of dueCampaigns) {
    try {
      const r = await sendCampaign(c.id);
      if (r.sent > 0 || r.failed > 0) results.campaignsSent++;
      else results.campaignsFailed++;
    } catch (e) {
      results.campaignsFailed++;
      results.errors.push(`campaign ${c.id}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  // 2. Follow-up sequence — engaged prospects idle for FOLLOW_UP_AFTER_DAYS+
  const cutoff = new Date(Date.now() - FOLLOW_UP_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const dueProspects = await prisma.prospect.findMany({
    where: {
      optedOut: false,
      email: { not: null },
      status: { in: ["contacted", "interested", "negotiating"] },
      lastContactedAt: { lt: cutoff },
    },
    include: { reseller: { select: { storeName: true, storeSlug: true } } },
    orderBy: { lastContactedAt: "asc" },
    take: MAX_FOLLOW_UPS_PER_RUN,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.intactconnect.com.gh";

  for (const p of dueProspects) {
    const storeUrl = `https://www.intactconnect.com.gh/store/${p.reseller.storeSlug}`;
    const subject = `Following up — ${p.reseller.storeName}`;
    const body = `Hi ${p.name},\n\nJust checking in — wanted to make sure you saw the IntactConnect offer from ${p.reseller.storeName}. We supply genuine electronics at reseller prices with zero stock risk.\n\nYour store: ${storeUrl}\n\nHappy to answer any questions.\n\n— ${p.reseller.storeName}`;
    const unsub = `${appUrl}/api/unsubscribe?p=${p.id}&e=${encodeURIComponent(p.email || "")}&t=${unsubscribeToken(p.id, p.email || "")}`;
    const html = emailLayout(subject, `${body.replace(/\n/g, "<br/>")}<p style="font-size:11px;color:#999;margin-top:24px">Automated follow-up from ${p.reseller.storeName}. <a href="${unsub}" style="color:#999">Unsubscribe</a></p>`);
    try {
      await sendEmail(p.email!, subject, html);
      await prisma.prospect.update({ where: { id: p.id }, data: { lastContactedAt: new Date() } });
      await prisma.prospectActivity.create({
        data: { prospectId: p.id, type: "email_sent", body: "Automated follow-up (day 3+)" },
      });
      results.followUpsSent++;
    } catch (e) {
      results.followUpsFailed++;
      results.errors.push(`follow-up ${p.id}: ${e instanceof Error ? e.message.slice(0, 120) : "failed"}`);
    }
    await sleep(400);
  }

  return NextResponse.json({ ok: true, ...results });
}
