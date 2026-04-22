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
    include: {
      client: { select: { name: true, phone: true } },
      items: { include: { product: { select: { name: true, images: { take: 1, select: { url: true } } } } } },
    },
  });

  return NextResponse.json(orders);
}
