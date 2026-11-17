import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d30 = new Date(now.getTime() - 30 * 86400000);

  const d90 = new Date(now.getTime() - 90 * 86400000);
  const [views7, views30, productViews30, topProductEvents, orders30, orderRows] = await Promise.all([
    prisma.storeEvent.count({ where: { resellerId: reseller!.id, type: "store_view", createdAt: { gte: d7 } } }),
    prisma.storeEvent.count({ where: { resellerId: reseller!.id, type: "store_view", createdAt: { gte: d30 } } }),
    prisma.storeEvent.count({ where: { resellerId: reseller!.id, type: "product_view", createdAt: { gte: d30 } } }),
    prisma.storeEvent.groupBy({
      by: ["productId"],
      where: { resellerId: reseller!.id, type: "product_view", productId: { not: null }, createdAt: { gte: d30 } },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
    prisma.resellerOrder.count({ where: { resellerId: reseller!.id, createdAt: { gte: d30 } } }),
    prisma.resellerOrder.findMany({
      where: { resellerId: reseller!.id, createdAt: { gte: d90 } },
      select: { total: true, commission: true, createdAt: true },
    }),
  ]);

  const productIds = topProductEvents.map((e) => e.productId).filter(Boolean) as string[];
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, images: { take: 1, orderBy: { order: "asc" as const }, select: { url: true } } },
      })
    : [];
  const nameMap = new Map(products.map((p) => [p.id, p]));

  // Daily store views for a 14-day sparkline
  const rawDaily = await prisma.storeEvent.findMany({
    where: { resellerId: reseller!.id, type: "store_view", createdAt: { gte: new Date(now.getTime() - 14 * 86400000) } },
    select: { createdAt: true },
  });
  const daily = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(now.getTime() - (13 - i) * 86400000).toDateString();
    return rawDaily.filter((e) => e.createdAt.toDateString() === day).length;
  });

  const totalViews = views30;
  const conversion = totalViews > 0 ? Math.round((orders30 / totalViews) * 1000) / 10 : 0;

  // Daily sales + commission buckets for the 90-day trend chart
  const salesDaily = Array.from({ length: 90 }, (_, i) => {
    const day = new Date(now.getTime() - (89 - i) * 86400000).toDateString();
    const rows = orderRows.filter((o) => o.createdAt.toDateString() === day);
    return {
      date: day,
      sales: Math.round(rows.reduce((s, o) => s + o.total, 0) * 100) / 100,
      commission: Math.round(rows.reduce((s, o) => s + o.commission, 0) * 100) / 100,
      orders: rows.length,
    };
  });

  return NextResponse.json({
    views7,
    views30,
    productViews30,
    orders30,
    conversion,
    daily,
    salesDaily,
    topProducts: topProductEvents.map((e) => ({
      productId: e.productId,
      views: e._count.productId,
      name: nameMap.get(e.productId as string)?.name || "Product",
      image: nameMap.get(e.productId as string)?.images?.[0]?.url || null,
    })),
  });
}
