import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getInv(rid: string, iid: string) {
  return prisma.invoice.findFirst({
    where: { id: iid, resellerId: rid },
    include: { client: { select: { id: true, name: true, email: true } }, items: true },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(req);
  if (error) return error;
  const { id } = await params;
  const inv = await getInv(reseller!.id, id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(req);
  if (error) return error;
  const { id } = await params;
  const existing = await getInv(reseller!.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (["paid", "confirmed"].includes(existing.status))
    return NextResponse.json({ error: "Cannot edit paid/confirmed invoice" }, { status: 400 });

  const b = await req.json();
  if (b.items?.length) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    const sub = b.items.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);
    const tx = b.tax ?? existing.tax;
    const inv = await prisma.invoice.update({
      where: { id },
      data: {
        clientId: b.clientId !== undefined ? (b.clientId || null) : existing.clientId,
        subtotal: sub, tax: tx, total: sub + tx,
        dueDate: b.dueDate !== undefined ? (b.dueDate ? new Date(b.dueDate) : null) : existing.dueDate,
        notes: b.notes !== undefined ? (b.notes || null) : existing.notes,
        status: b.status || existing.status,
        items: { create: b.items.map((i: any) => ({ productId: i.productId || null, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice })) },
      },
      include: { client: { select: { id: true, name: true, email: true } }, items: true },
    });
    return NextResponse.json(inv);
  }
  const inv = await prisma.invoice.update({
    where: { id },
    data: {
      ...(b.clientId !== undefined && { clientId: b.clientId || null }),
      ...(b.tax !== undefined && { tax: b.tax }),
      ...(b.dueDate !== undefined && { dueDate: b.dueDate ? new Date(b.dueDate) : null }),
      ...(b.notes !== undefined && { notes: b.notes || null }),
      ...(b.status && { status: b.status }),
    },
    include: { client: { select: { id: true, name: true, email: true } }, items: true },
  });
  return NextResponse.json(inv);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(req);
  if (error) return error;
  const { id } = await params;
  const inv = await getInv(reseller!.id, id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (["paid", "confirmed", "sent"].includes(inv.status) || inv.amountPaid > 0)
    return NextResponse.json({ error: "Cannot delete invoice with payment or confirmed status" }, { status: 400 });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
