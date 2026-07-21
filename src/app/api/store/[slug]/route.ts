import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { storeSlug: slug, status: "approved" },
    select: {
      id: true, storeName: true, storeSlug: true, bio: true, picture: true, phone: true, email: true,
      storeLogo: true, storeBanner: true, storeTagline: true, storeThemeColor: true,
      selectedCategoryIds: true, selectedProductIds: true, onboardingComplete: true,
      promotions: {
        where: { active: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, description: true, image: true, discount: true, code: true, startDate: true, endDate: true },
      },
    },
  });

  if (!reseller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const selectedCategoryIds = (reseller.selectedCategoryIds as string[] | null) || null;
  const selectedProductIds = (reseller.selectedProductIds as string[] | null) || null;
  const hasSelections = selectedCategoryIds?.length || selectedProductIds?.length;

  // Category filter base
  const categoryWhere: Record<string, unknown> = { parentId: null };
  if (selectedCategoryIds?.length) categoryWhere.id = { in: selectedCategoryIds };

  // Get parent categories with subcategories
  const categories = await prisma.category.findMany({
    where: categoryWhere,
    select: {
      id: true, name: true, slug: true, image: true,
      children: {
        where: selectedCategoryIds?.length ? { id: { in: selectedCategoryIds } } : undefined,
        select: { id: true, name: true, slug: true, image: true },
        orderBy: { name: "asc" },
      },
      _count: { select: { products: { where: { status: "active", stock: { gt: 0 } } } } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ ...reseller, categories, hasSelections });
}
