import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const campaigns = await prisma.campaign.findMany({
    where: { resellerId: reseller!.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { recipients: true } },
      recipients: { select: { status: true } },
    },
  });
  // attach sent/failed counts
  const result = campaigns.map((c) => {
    const counts = { sent: 0, failed: 0, pending: 0 };
    for (const r of c.recipients) {
      if (r.status === "sent" || r.status === "opened" || r.status === "clicked" || r.status === "replied") counts.sent++;
      else if (r.status === "failed") counts.failed++;
      else counts.pending++;
    }
    const { recipients, ...rest } = c;
    return { ...rest, counts };
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const body = await request.json();
  const { name, channel, subject, body: campaignBody, productIds, prospectIds, filters, scheduledAt } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!campaignBody?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });
  if (!["email", "whatsapp", "both"].includes(channel)) {
    return NextResponse.json({ error: "Channel must be email, whatsapp, or both" }, { status: 400 });
  }

  // Resolve audience
  let where: Record<string, unknown> = { resellerId: reseller!.id, status: { notIn: ["converted", "lost"] }, optedOut: false };
  if (Array.isArray(prospectIds) && prospectIds.length) {
    where.id = { in: prospectIds };
  } else if (filters && typeof filters === "object") {
    if (filters.area) where.area = { contains: filters.area, mode: "insensitive" };
    if (filters.status && filters.status !== "all") where.status = filters.status;
    if (filters.hasPhone === true) where.phone = { not: null };
    if (filters.hasEmail === true) where.email = { not: null };
  }

  const prospects = await prisma.prospect.findMany({
    where,
    select: { id: true, name: true, email: true, phone: true },
  });
  if (prospects.length === 0) {
    return NextResponse.json({ error: "No prospects match this audience" }, { status: 400 });
  }

  // Build recipient rows per channel with real destinations
  const recipientRows: { prospectId: string; channel: string; destination: string }[] = [];
  for (const p of prospects) {
    if ((channel === "email" || channel === "both") && p.email) {
      recipientRows.push({ prospectId: p.id, channel: "email", destination: p.email });
    }
    if ((channel === "whatsapp" || channel === "both") && p.phone) {
      recipientRows.push({ prospectId: p.id, channel: "whatsapp", destination: p.phone.replace(/\D/g, "") });
    }
  }
  if (recipientRows.length === 0) {
    return NextResponse.json({ error: "Audience has no reachable contacts for the selected channel(s)" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      resellerId: reseller!.id,
      name: name.trim(),
      channel,
      subject: channel === "whatsapp" ? null : (subject?.trim() || name.trim()),
      body: campaignBody,
      productIds: productIds ? JSON.stringify(productIds) : null,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      recipients: { create: recipientRows },
    },
    include: { _count: { select: { recipients: true } } },
  });

  return NextResponse.json(campaign, { status: 201 });
}
