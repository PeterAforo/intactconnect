import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, resellerId: reseller!.id },
    include: {
      recipients: {
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { prospect: { select: { id: true, name: true, area: true, status: true } } },
      },
    },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.campaign.findFirst({ where: { id, resellerId: reseller!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "sent" || existing.status === "sending") {
    return NextResponse.json({ error: "Cannot edit a sent campaign" }, { status: 400 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const k of ["name", "channel", "subject", "body", "productIds", "status", "scheduledAt"]) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.productIds && typeof body.productIds !== "string") data.productIds = JSON.stringify(body.productIds);
  if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt as string);

  const campaign = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json(campaign);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.campaign.findFirst({ where: { id, resellerId: reseller!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "sending") return NextResponse.json({ error: "Campaign is sending" }, { status: 400 });

  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
