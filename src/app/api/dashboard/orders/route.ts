import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { resellerId: reseller!.id };
  if (status && status !== "all") where.status = status;

  const orders = await prisma.resellerOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, orderNumber: true, total: true, commission: true, status: true, paymentStatus: true, commissionReleased: true,
      shippingName: true, createdAt: true,
      client: { select: { name: true, phone: true } },
      items: { include: { product: { select: { name: true, images: { take: 1, select: { url: true } } } } } },
    },
  });

  return NextResponse.json(orders);
}
