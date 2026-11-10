import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error } = await verifyReseller(request);
  if (error) return error;

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(48, parseInt(url.searchParams.get("limit") || "24"));

  const where: Record<string, unknown> = { status: "active" };
  if (category) {
    where.AND = [
      { OR: [{ categoryId: category }, { category: { parentId: category } }] },
    ];
  }
  if (search) {
    const words = search.trim().split(/\s+/).filter(Boolean);
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      ...words.map((w) => ({
        OR: [
          { name: { contains: w, mode: "insensitive" } },
          { sku: { contains: w, mode: "insensitive" } },
        ],
      })),
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, sku: true, slug: true, price: true, stock: true,
        images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const margins = await prisma.categoryMargin.findMany({ select: { categoryId: true, marginPercent: true } });
  const marginMap = new Map(margins.map(m => [m.categoryId, m.marginPercent]));

  const result = products.map(p => {
    const marginPercent = marginMap.get(p.category.id) || 0;
    const resellerPrice = Math.ceil(p.price * (1 + marginPercent / 100));
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      slug: p.slug,
      price: p.price,
      stock: p.stock,
      marginPercent,
      resellerPrice,
      commissionPerUnit: resellerPrice - p.price,
      image: p.images[0]?.url || null,
      category: p.category.name,
    };
  });

  return NextResponse.json({
    products: result,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
