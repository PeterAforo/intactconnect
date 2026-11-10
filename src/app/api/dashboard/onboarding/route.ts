import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: {
      id: true, name: true, slug: true, image: true,
      children: {
        where: { products: { some: { status: "active", stock: { gt: 0 } } } },
        select: { id: true, name: true, slug: true, image: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const products = await prisma.product.findMany({
    where: { status: "active", stock: { gt: 0 } },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true, price: true, comparePrice: true,
      images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      category: { select: { id: true, name: true } },
      rating: true, reviewCount: true, stock: true,
    },
  });

  const productsWithImage = products.map((p) => ({
    ...p,
    image: p.images[0]?.url || null,
    originalPrice: p.price,
  }));

  return NextResponse.json({
    categories,
    products: productsWithImage,
    selectedCategoryIds: (reseller!.selectedCategoryIds as string[] | null) || [],
    selectedProductIds: (reseller!.selectedProductIds as string[] | null) || [],
    onboardingComplete: reseller!.onboardingComplete,
    storeTagline: reseller!.storeTagline,
    storeThemeColor: reseller!.storeThemeColor,
    storeSlug: reseller!.storeSlug,
  });
}

export async function PUT(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const body = await request.json();
  const data: Record<string, unknown> = { onboardingComplete: true };

  if ("selectedCategoryIds" in body) data.selectedCategoryIds = Array.isArray(body.selectedCategoryIds) ? body.selectedCategoryIds : [];
  if ("selectedProductIds" in body) data.selectedProductIds = Array.isArray(body.selectedProductIds) ? body.selectedProductIds : [];
  if ("storeTagline" in body) data.storeTagline = typeof body.storeTagline === "string" ? body.storeTagline.slice(0, 120) || null : null;
  if ("storeThemeColor" in body) data.storeThemeColor = typeof body.storeThemeColor === "string" && /^#[0-9a-fA-F]{6}$/.test(body.storeThemeColor) ? body.storeThemeColor : null;

  const updated = await prisma.reseller.update({
    where: { id: reseller!.id },
    data,
    select: {
      id: true, selectedCategoryIds: true, selectedProductIds: true, onboardingComplete: true,
      storeTagline: true, storeThemeColor: true,
    },
  });

  return NextResponse.json(updated);
}
