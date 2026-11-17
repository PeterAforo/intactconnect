import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

const REFERRAL_BONUS_GHS = 25;

const orderSum = {
  _sum: { total: true, commission: true },
  _count: { id: true },
} as const;

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [allTime, thisMonth, lastMonth, recentOrders, clientCount, recruits, pendingPayout] = await Promise.all([
    prisma.resellerOrder.aggregate({ where: { resellerId: reseller!.id }, ...orderSum }),
    prisma.resellerOrder.aggregate({ where: { resellerId: reseller!.id, createdAt: { gte: startOfMonth } }, ...orderSum }),
    prisma.resellerOrder.aggregate({ where: { resellerId: reseller!.id, createdAt: { gte: startOfLastMonth, lt: startOfMonth } }, ...orderSum }),
    prisma.resellerOrder.findMany({
      where: { resellerId: reseller!.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, orderNumber: true, total: true, commission: true, status: true, createdAt: true,
        client: { select: { name: true } },
      },
    }),
    prisma.resellerClient.count({ where: { resellerId: reseller!.id } }),
    prisma.reseller.findMany({
      where: { referredById: reseller!.id },
      select: { id: true, storeName: true, createdAt: true },
    }),
    prisma.payout.findFirst({
      where: { resellerId: reseller!.id, status: "requested" },
      select: { amount: true, requestedAt: true },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  // Lazy-credit referral bonus: GH₵25 per recruit who has ≥1 delivered/paid order
  let bonusPaid = reseller!.referralBonusPaid || 0;
  if (recruits.length > 0) {
    const deliveredCounts = await prisma.resellerOrder.groupBy({
      by: ["resellerId"],
      where: {
        resellerId: { in: recruits.map((r) => r.id) },
        status: { in: ["delivered", "completed", "confirmed", "paid"] },
      },
      _count: { id: true },
    });
    const qualified = deliveredCounts.filter((c) => c._count.id > 0).length;
    const bonusDue = qualified * REFERRAL_BONUS_GHS;
    if (bonusDue > bonusPaid) {
      const credit = bonusDue - bonusPaid;
      await prisma.reseller.update({
        where: { id: reseller!.id },
        data: { referralBonusPaid: bonusDue, commissionBalance: { increment: credit } },
      });
      bonusPaid = bonusDue;
    }
  }

  const period = (a: typeof allTime) => ({
    sales: Math.round((a._sum.total || 0) * 100) / 100,
    commission: Math.round((a._sum.commission || 0) * 100) / 100,
    orders: a._count.id,
  });

  return NextResponse.json({
    totalSales: Math.round((allTime._sum.total || 0) * 100) / 100,
    totalOrders: allTime._count.id,
    totalCommission: Math.round((allTime._sum.commission || 0) * 100) / 100,
    totalClients: clientCount,
    commissionBalance: reseller!.commissionBalance || 0,
    pendingCommission: reseller!.pendingCommission || 0,
    pendingPayout,
    thisMonth: period(thisMonth),
    lastMonth: period(lastMonth),
    referralCode: reseller!.referralCode,
    referralCount: recruits.length,
    referralBonusPaid: bonusPaid,
    recentOrders,
  });
}
