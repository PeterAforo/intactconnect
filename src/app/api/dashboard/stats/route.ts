import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const [orders, clientCount] = await Promise.all([
    prisma.resellerOrder.findMany({
      where: { resellerId: reseller!.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, total: true, commission: true, status: true, createdAt: true },
    }),
    prisma.resellerClient.count({ where: { resellerId: reseller!.id } }),
  ]);

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  return NextResponse.json({
    totalSales,
    totalOrders: orders.length,
    totalClients: clientCount,
    commissionBalance: reseller!.commissionBalance,
    recentOrders: orders.slice(0, 5),
  });
}
