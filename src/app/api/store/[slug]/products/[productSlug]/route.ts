import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; productSlug: string }> }
) {
  const { slug, productSlug } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { storeSlug: slug, status: "approved" },
    select: { id: true, storeName: true },
  });

  if (!reseller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    select: {
      id: true, name: true, slug: true, description: true, price: true,
      comparePrice: true, sku: true, stock: true, rating: true, reviewCount: true, specs: true,
      images: { orderBy: { order: "asc" }, select: { id: true, url: true, alt: true } },
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      reviews: {
        take: 10, orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  });

  if (!product || product.stock <= 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Apply reseller margin
  const margin = await prisma.categoryMargin.findUnique({
    where: { categoryId: product.category.id },
    select: { marginPercent: true },
  });

  const marginPercent = margin?.marginPercent || 0;
  const resellerPrice = Math.ceil(product.price * (1 + marginPercent / 100));

  // Get related products
  const related = await prisma.product.findMany({
    where: { categoryId: product.category.id, id: { not: product.id }, status: "active", stock: { gt: 0 } },
    take: 8,
    select: {
      id: true, name: true, slug: true, price: true, comparePrice: true, rating: true, reviewCount: true,
      images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  const relatedWithMargin = related.map(p => ({
    ...p,
    resellerPrice: Math.ceil(p.price * (1 + marginPercent / 100)),
    image: p.images[0]?.url || null,
  }));

  return NextResponse.json({
    ...product,
    resellerPrice,
    originalPrice: product.price,
    image: product.images[0]?.url || null,
    related: relatedWithMargin,
  });
}
