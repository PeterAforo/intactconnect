import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";
import { unsubscribeToken } from "@/lib/unsubscribe";
import { trackToken } from "@/lib/track";

const MERGE_KEYS = ["name", "business", "store", "link", "agent", "area", "phone", "email"];

function mergeFields(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const k of MERGE_KEYS) {
    out = out.replaceAll(`{{${k}}}`, vars[k] ?? "");
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SendResult {
  sent: number;
  failed: number;
  whatsappQueue: { prospectId: string; name: string; link: string }[];
  status: string;
  skipped?: boolean;
}

/**
 * Send all pending recipients of a campaign. Shared by the manual send
 * route and the cron route (scheduled campaigns).
 */
export async function sendCampaign(campaignId: string): Promise<SendResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      reseller: { select: { id: true, storeName: true, storeSlug: true } },
      recipients: {
        where: { status: "pending" },
        include: { prospect: true },
      },
    },
  });
  if (!campaign) return { sent: 0, failed: 0, whatsappQueue: [], status: "missing", skipped: true };
  if (campaign.status === "sent") return { sent: 0, failed: 0, whatsappQueue: [], status: "sent", skipped: true };

  const reseller = campaign.reseller;
  const storeUrl = `https://www.intactconnect.com.gh/store/${reseller.storeSlug}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.intactconnect.com.gh";
  const baseVars: Record<string, string> = {
    store: reseller.storeName,
    link: storeUrl,
    agent: reseller.storeName,
  };

  // Featured product offers block
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

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sending" } });

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
      const unsub = `${appUrl}/api/unsubscribe?p=${p.id}&e=${encodeURIComponent(p.email || "")}&t=${unsubscribeToken(p.id, p.email || "")}`;
      const t = trackToken(r.id);
      const trackClick = (url: string) =>
        `${appUrl}/api/track/click?id=${r.id}&t=${t}&u=${encodeURIComponent(url)}`;
      let bodyHtml = `${text.replace(/\n/g, "<br/>")}${productBlock}<p style="font-size:11px;color:#999;margin-top:24px">You received this because a business you may be interested in shared IntactConnect with you. <a href="${unsub}" style="color:#999">Unsubscribe</a></p>`;
      bodyHtml = bodyHtml.replace(/href="(https?:\/\/[^"]+)"/g, (_m, url) => `href="${trackClick(url)}"`);
      bodyHtml += `<img src="${appUrl}/api/track/open?id=${r.id}&t=${t}" width="1" height="1" alt="" style="display:none" />`;
      const html = emailLayout(campaign.name, bodyHtml);
      try {
        await sendEmail(r.destination, subject, html);
        await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "sent", sentAt: new Date() } });
        await prisma.prospect.update({ where: { id: p.id }, data: { lastContactedAt: new Date() } });
        await prisma.prospectActivity.create({ data: { prospectId: p.id, type: "email_sent", body: `Campaign: ${campaign.name}`, metadata: JSON.stringify({ campaignId }) } });
        if (p.status === "new") {
          await prisma.prospect.update({ where: { id: p.id }, data: { status: "contacted" } });
          await prisma.prospectActivity.create({ data: { prospectId: p.id, type: "status_change", body: "new → contacted (campaign)" } });
        }
        sent++;
      } catch (e) {
        await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "failed", error: e instanceof Error ? e.message.slice(0, 300) : "send failed" } });
        failed++;
      }
      await sleep(400);
    } else if (r.channel === "whatsapp" && isWaCampaign) {
      const text = encodeURIComponent(mergeFields(campaign.body, vars));
      waLinks.push({ prospectId: p.id, name: p.name, link: `https://wa.me/${r.destination}?text=${text}` });
      await prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "pending", error: "whatsapp_queue" } });
    }
  }

  const hasEmailPending = recipients.some((r) => r.channel === "email" && isEmailCampaign);
  const finalStatus = isWaCampaign && waLinks.length && !hasEmailPending ? "sending" : "sent";
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: finalStatus, sentAt: finalStatus === "sent" ? new Date() : null },
  });

  return { sent, failed, whatsappQueue: waLinks, status: finalStatus };
}
