import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_STATUS = ["new", "contacted", "interested", "negotiating", "converted", "lost"];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({
    where: { id, resellerId: reseller!.id },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 100 },
      campaignRecipients: { include: { campaign: { select: { id: true, name: true, channel: true, status: true } } } },
    },
  });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prospect);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.prospect.findFirst({ where: { id, resellerId: reseller!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const k of ["name", "type", "category", "phone", "email", "website", "address", "area", "latitude", "longitude", "notes", "tags"]) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.tags && typeof body.tags !== "string") data.tags = JSON.stringify(body.tags);

  // Standalone activity log (notes, calls, meetings)
  if (body.activity && typeof body.activity === "object" && body.activity.body) {
    await prisma.prospectActivity.create({
      data: {
        prospectId: id,
        type: ["note", "call", "meeting", "email_sent", "whatsapp_sent"].includes(body.activity.type) ? body.activity.type : "note",
        body: String(body.activity.body).slice(0, 2000),
      },
    });
    return NextResponse.json({ ok: true });
  }

  // Append note (keeps history, doesn't overwrite)
  if (body.appendNote?.trim()) {
    const stamp = new Date().toLocaleString();
    const merged = [existing.notes, `[${stamp}] ${body.appendNote.trim()}`].filter(Boolean).join("\n\n");
    data.notes = merged;
    await prisma.prospectActivity.create({
      data: { prospectId: id, type: "note", body: body.appendNote.trim().slice(0, 500) },
    });
  }

  // Status change → log activity
  if (body.status !== undefined && VALID_STATUS.includes(body.status) && body.status !== existing.status) {
    data.status = body.status;
    await prisma.prospectActivity.create({
      data: { prospectId: id, type: "status_change", body: `${existing.status} → ${body.status}`, metadata: JSON.stringify({ from: existing.status, to: body.status }) },
    });
  }

  const prospect = await prisma.prospect.update({ where: { id }, data });
  return NextResponse.json(prospect);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.prospect.findFirst({ where: { id, resellerId: reseller!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.prospect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
