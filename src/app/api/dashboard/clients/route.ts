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

  const { name, email, phone, address, city, region } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const client = await prisma.resellerClient.create({
    data: { resellerId: reseller!.id, name, email: email || null, phone: phone || null, address: address || null, city: city || null, region: region || null },
  });

  return NextResponse.json(client, { status: 201 });
}
