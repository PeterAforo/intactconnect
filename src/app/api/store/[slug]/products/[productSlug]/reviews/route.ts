import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/store/[slug]/products/[productSlug]/reviews?page=1
// Public endpoint — returns paginated reviews + rating distribution for a product.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; productSlug: string }> }
) {
  const { slug, productSlug } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 10;

  // Verify the store exists and is approved
  const reseller = await prisma.reseller.findUnique({
    where: { storeSlug: slug, status: "approved" },
    select: { id: true },
  });
  if (!reseller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    select: { id: true, rating: true, reviewCount: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { productId: product.id } }),
  ]);

  const distribution = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId: product.id },
    _count: { rating: true },
  });

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distribution) dist[d.rating] = d._count.rating;

  return NextResponse.json({
    reviews,
    total,
    page,
    limit,
    distribution: dist,
    rating: product.rating,
    reviewCount: product.reviewCount,
  });
}
