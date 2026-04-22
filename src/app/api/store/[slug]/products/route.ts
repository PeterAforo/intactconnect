import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "newest";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;

  const reseller = await prisma.reseller.findUnique({
    where: { storeSlug: slug, status: "approved" },
    select: { id: true },
  });

  if (!reseller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Build filter
  const where: Record<string, unknown> = { status: "active", stock: { gt: 0 } };
  if (categoryId) where.categoryId = categoryId;
  if (search) where.name = { contains: search, mode: "insensitive" };

  // Sort
  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };
  if (sort === "name") orderBy = { name: "asc" };
  if (sort === "popular") orderBy = { reviewCount: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, slug: true, price: true, comparePrice: true,
        images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        category: { select: { id: true, name: true, slug: true } },
        rating: true, reviewCount: true, stock: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Get categories with margins for price markup
  const margins = await prisma.categoryMargin.findMany({ select: { categoryId: true, marginPercent: true } });
  const marginMap = new Map(margins.map((m) => [m.categoryId, m.marginPercent]));

  // Apply margin to prices
  const productsWithMargin = products.map((p) => {
    const margin = marginMap.get(p.category.id) || 0;
    const markup = 1 + margin / 100;
    return {
      ...p,
      resellerPrice: Math.ceil(p.price * markup),
      originalPrice: p.price,
      image: p.images[0]?.url || null,
    };
  });

  return NextResponse.json({
    products: productsWithMargin,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
