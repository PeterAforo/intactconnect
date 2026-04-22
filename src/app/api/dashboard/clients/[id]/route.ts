import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getClient(resellerId: string, clientId: string) {
  return prisma.resellerClient.findFirst({
    where: { id: clientId, resellerId },
    include: { _count: { select: { orders: true, invoices: true } } },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const client = await getClient(reseller!.id, id);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  return NextResponse.json(client);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const existing = await getClient(reseller!.id, id);
  if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const client = await prisma.resellerClient.update({
    where: { id },
    data: {
      clientType: body.clientType || existing.clientType,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      digitalAddress: body.digitalAddress || null,
      city: body.city || null,
      region: body.region || null,
      landmark: body.landmark || null,
      latitude: body.latitude ? parseFloat(body.latitude) : null,
      longitude: body.longitude ? parseFloat(body.longitude) : null,
      nationalIdType: body.nationalIdType || null,
      nationalIdNumber: body.nationalIdNumber || null,
      nationalIdImage: body.nationalIdImage || null,
      companyName: body.companyName || null,
      companyRegNumber: body.companyRegNumber || null,
      taxId: body.taxId || null,
      companyDocUrl: body.companyDocUrl || null,
      companyTaxDocUrl: body.companyTaxDocUrl || null,
      contactPersonName: body.contactPersonName || null,
      contactPersonEmail: body.contactPersonEmail || null,
      contactPersonPhone: body.contactPersonPhone || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(client);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const existing = await getClient(reseller!.id, id);
  if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (existing._count.orders > 0 || existing._count.invoices > 0) {
    return NextResponse.json({ error: "Cannot delete client with existing orders or invoices" }, { status: 400 });
  }

  await prisma.resellerClient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
