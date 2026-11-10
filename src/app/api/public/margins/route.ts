import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public read-only endpoint powering the landing page:
 * - real commission rates per category (CategoryMargin)
 * - example products with computed per-unit commission
 * - real catalog counts
 * No user data, safe to expose.
 */
export async function GET() {
  try {
    const [margins, productCount, categoryCount, resellerCount, exampleProducts] = await Promise.all([
      prisma.categoryMargin.findMany({
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { marginPercent: "desc" },
      }),
      prisma.product.count({ where: { status: "active" } }),
      prisma.category.count({ where: { parentId: null } }),
      prisma.reseller.count({ where: { status: "approved" } }),
      prisma.product.findMany({
        where: { status: "active", price: { gt: 0 } },
        take: 6,
        orderBy: { featured: "desc" },
        select: {
          id: true, name: true, price: true, slug: true,
          categoryId: true,
          images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        },
      }),
    ]);

    const marginMap = new Map(margins.map((m) => [m.categoryId, m.marginPercent]));

    return NextResponse.json({
      margins: margins.map((m) => ({
        categoryId: m.categoryId,
        categoryName: m.category.name,
        marginPercent: m.marginPercent,
      })),
      stats: {
        products: productCount,
        categories: categoryCount,
        resellers: resellerCount,
      },
      examples: exampleProducts.map((p) => {
        const margin = marginMap.get(p.categoryId) || 0;
        const resellerPrice = Math.ceil(p.price * (1 + margin / 100));
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          resellerPrice,
          commission: resellerPrice - p.price,
          marginPercent: margin,
          image: p.images[0]?.url || null,
          slug: p.slug,
        };
      }),
    });
  } catch (error) {
    console.error("Public margins error:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
