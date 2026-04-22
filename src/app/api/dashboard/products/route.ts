import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error } = await verifyReseller(request);
  if (error) return error;

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const where: Record<string, unknown> = { status: "active" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    take: 20,
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, sku: true, price: true,
      images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      category: { select: { id: true, name: true } },
    },
  });

  // Get margins for price calculation
  const margins = await prisma.categoryMargin.findMany({ select: { categoryId: true, marginPercent: true } });
  const marginMap = new Map(margins.map(m => [m.categoryId, m.marginPercent]));

  const result = products.map(p => {
    const margin = marginMap.get(p.category.id) || 0;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      resellerPrice: Math.ceil(p.price * (1 + margin / 100)),
      image: p.images[0]?.url || null,
      category: p.category.name,
    };
  });

  return NextResponse.json(result);
}
