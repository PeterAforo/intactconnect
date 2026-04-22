import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getPromo(rid: string, pid: string) {
  return prisma.resellerPromotion.findFirst({ where: { id: pid, resellerId: rid } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(req);
  if (error) return error;
  const { id } = await params;
  const p = await getPromo(reseller!.id, id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(p);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(req);
  if (error) return error;
  const { id } = await params;
  const existing = await getPromo(reseller!.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json();
  const p = await prisma.resellerPromotion.update({
    where: { id },
    data: {
      ...(b.title && { title: b.title }),
      ...(b.description !== undefined && { description: b.description || null }),
      ...(b.discount !== undefined && { discount: b.discount ? parseFloat(b.discount) : null }),
      ...(b.code !== undefined && { code: b.code || null }),
      ...(b.startDate && { startDate: new Date(b.startDate) }),
      ...(b.endDate && { endDate: new Date(b.endDate) }),
      ...(b.active !== undefined && { active: b.active }),
    },
  });
  return NextResponse.json(p);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(req);
  if (error) return error;
  const { id } = await params;
  const existing = await getPromo(reseller!.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.resellerPromotion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
