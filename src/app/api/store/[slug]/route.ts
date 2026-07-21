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
  const hasSelections = Boolean(selectedCategoryIds?.length || selectedProductIds?.length);
  const selectedSet = new Set(selectedCategoryIds || []);
  const hasCatSelection = selectedSet.size > 0;

  // Get all parent categories with their subcategories (each with product counts)
  const allParents = await prisma.category.findMany({
    where: { parentId: null },
    select: {
      id: true, name: true, slug: true, image: true,
      children: {
        select: {
          id: true, name: true, slug: true, image: true,
          _count: { select: { products: { where: { status: "active", stock: { gt: 0 } } } } },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { products: { where: { status: "active", stock: { gt: 0 } } } } },
    },
    orderBy: { order: "asc" },
  });

  const categories = allParents
    .map((parent) => {
      const parentSelected = selectedSet.has(parent.id);

      // Only show subcategories that have in-stock products
      let children = parent.children.filter((c) => (c._count?.products || 0) > 0);

      // If the reseller made category selections and did NOT select this whole parent,
      // narrow the visible subcategories to the ones they explicitly picked
      if (hasCatSelection && !parentSelected) {
        children = children.filter((c) => selectedSet.has(c.id));
      }

      return {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        image: parent.image,
        children: children.map(({ id, name, slug, image }) => ({ id, name, slug, image })),
        _count: parent._count,
      };
    })
    .filter((parent) => {
      const hasProducts = (parent._count?.products || 0) > 0 || parent.children.length > 0;
      if (!hasCatSelection) return hasProducts;
      // With selections: show parent if it was selected or any of its children remain visible
      return selectedSet.has(parent.id) || parent.children.length > 0;
    });

  return NextResponse.json({ ...reseller, categories, hasSelections });
}
