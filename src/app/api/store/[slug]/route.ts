import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { storeSlug: slug, status: "approved" },
    select: {
      id: true, storeName: true, storeSlug: true, bio: true, picture: true, phone: true, email: true,
      storeLogo: true, storeBanner: true, storeTagline: true, storeThemeColor: true,
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

  // Get categories that have active products
  const categories = await prisma.category.findMany({
    where: { products: { some: { status: "active", stock: { gt: 0 } } } },
    select: { id: true, name: true, slug: true, image: true, _count: { select: { products: { where: { status: "active", stock: { gt: 0 } } } } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ...reseller, categories });
}
