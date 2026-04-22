import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(req);
  if (error) return error;
  const { id } = await params;

  const order = await prisma.resellerOrder.findFirst({
    where: { id, resellerId: reseller!.id },
    include: {
      client: { select: { name: true, phone: true, email: true } },
      items: { include: { product: { select: { name: true, images: { take: 1, select: { url: true } } } } } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}
