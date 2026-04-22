import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const clients = await prisma.resellerClient.findMany({
    where: { resellerId: reseller!.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, invoices: true } } },
  });

  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const body = await request.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const client = await prisma.resellerClient.create({
    data: {
      resellerId: reseller!.id,
      clientType: body.clientType || "individual",
      name,
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

  return NextResponse.json(client, { status: 201 });
}
