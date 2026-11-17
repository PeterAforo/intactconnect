import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";
import { unsubscribeToken } from "@/lib/unsubscribe";

const MERGE_KEYS = ["name", "business", "store", "link", "agent", "area", "phone", "email"];

function mergeFields(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const k of MERGE_KEYS) {
    out = out.replaceAll(`{{${k}}}`, vars[k] ?? "");
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, resellerId: reseller!.id },
    include: {
      recipients: {
        where: { status: "pending" },
        include: { prospect: true },
      },
    },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (campaign.status === "sent") return NextResponse.json({ error: "Already sent" }, { status: 400 });

  const storeUrl = `https://www.intactconnect.com.gh/store/${reseller!.storeSlug}`;
  const baseVars: Record<string, string> = {
    store: reseller!.storeName,
    link: storeUrl,
    agent: reseller!.storeName,
  };

  // Load featured products for offer blocks (if any)
  let productBlock = "";
  if (campaign.productIds) {
    try {
      const ids: string[] = JSON.parse(campaign.productIds);
      if (ids.length) {
        const products = await prisma.product.findMany({
          where: { id: { in: ids.slice(0, 6) } },
          select: { name: true, price: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
        });
        if (products.length) {
          productBlock = `<div style="margin:16px 0"><p style="font-weight:600;margin-bottom:8px">Featured offers</p>${products.map((p) => `
            <div style="display:flex;align-items:center;gap:10px;border:1px solid #eee;border-radius:8px;padding:8px;margin-bottom:6px">
              ${p.images[0]?.url ? `<img src="${p.images[0].url}" width="44" height="44" style="border-radius:6px;object-fit:cover" />` : ""}
              <div><p style="margin:0;font-size:14px">${p.name}</p><p style="margin:0;font-size:13px;color:#555">GH₵${p.price.toLocaleString()}</p></div>
            </div>`).join("")}</div>`;
        }
      }
    } catch { /* ignore bad productIds */ }
  }

  const recipients = campaign.recipients;
  const isEmailCampaign = campaign.channel === "email" || campaign.channel === "both";
  const isWaCampaign = campaign.channel === "whatsapp" || campaign.channel === "both";

  // Mark campaign sending
  await prisma.campaign.update({ where: { id }, data: { status: "sending" } });

  let sent = 0, failed = 0;
  const waLinks: { prospectId: string; name: string; link: string }[] = [];

  for (const r of recipients) {
    const p = r.prospect;
    if (!p) {
      await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "failed", error: "Prospect deleted" } });
      failed++;
      continue;
    }
    const vars = {
      ...baseVars,
      name: p.name,
      business: p.name,
      area: p.area || "",
      phone: p.phone || "",
      email: p.email || "",
    };

    if (r.channel === "email" && isEmailCampaign) {
      if (p.optedOut) {
        await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "failed", error: "opted_out" } });
        failed++;
        continue;
      }
      const subject = mergeFields(campaign.subject || campaign.name, vars);
      const text = mergeFields(campaign.body, vars);
      const unsub = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.intactconnect.com.gh"}/api/unsubscribe?p=${p.id}&e=${encodeURIComponent(p.email || "")}&t=${unsubscribeToken(p.id, p.email || "")}`;
      const html = emailLayout(campaign.name, `${text.replace(/\n/g, "<br/>")}${productBlock}<p style="font-size:11px;color:#999;margin-top:24px">You received this because a business you may be interested in shared IntactConnect with you. <a href="${unsub}" style="color:#999">Unsubscribe</a></p>`);
      try {
        await sendEmail(r.destination, subject, html);
        await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "sent", sentAt: new Date() } });
        await prisma.prospect.update({ where: { id: p.id }, data: { lastContactedAt: new Date() } });
        await prisma.prospectActivity.create({ data: { prospectId: p.id, type: "email_sent", body: `Campaign: ${campaign.name}`, metadata: JSON.stringify({ campaignId: id }) } });
        if (p.status === "new") {
          await prisma.prospect.update({ where: { id: p.id }, data: { status: "contacted" } });
          await prisma.prospectActivity.create({ data: { prospectId: p.id, type: "status_change", body: "new → contacted (campaign)" } });
        }
        sent++;
      } catch (e) {
        await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "failed", error: e instanceof Error ? e.message.slice(0, 300) : "send failed" } });
        failed++;
      }
      await sleep(400); // gentle rate limit for sender reputation
    } else if (r.channel === "whatsapp" && isWaCampaign) {
      // WhatsApp can't be sent server-side without Business API — generate wa.me deep links.
      const text = encodeURIComponent(mergeFields(campaign.body, vars));
      waLinks.push({ prospectId: p.id, name: p.name, link: `https://wa.me/${r.destination}?text=${text}` });
      await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "pending", error: "whatsapp_queue" } });
    }
  }

  // If only whatsapp channel (or both), don't mark fully sent — leave as sending with queue.
  const hasEmailPending = recipients.some((r) => r.channel === "email" && isEmailCampaign);
  const finalStatus = isWaCampaign && waLinks.length && !hasEmailPending ? "sending" : "sent";
  await prisma.campaign.update({
    where: { id },
    data: { status: finalStatus, sentAt: finalStatus === "sent" ? new Date() : null },
  });

  return NextResponse.json({ sent, failed, whatsappQueue: waLinks, status: finalStatus });
}
