import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

const REFERRAL_BONUS_GHS = 25;

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const [orders, clientCount, recruits] = await Promise.all([
    prisma.resellerOrder.findMany({
      where: { resellerId: reseller!.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, total: true, commission: true, status: true, createdAt: true },
    }),
    prisma.resellerClient.count({ where: { resellerId: reseller!.id } }),
    prisma.reseller.findMany({
      where: { referredById: reseller!.id },
      select: { id: true, storeName: true, createdAt: true },
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

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  return NextResponse.json({
    totalSales,
    totalOrders: orders.length,
    totalClients: clientCount,
    commissionBalance: (reseller!.commissionBalance || 0) + Math.max(0, bonusPaid - (reseller!.referralBonusPaid || 0)),
    referralCode: reseller!.referralCode,
    referralCount: recruits.length,
    referralBonusPaid: bonusPaid,
    recentOrders: orders.slice(0, 5),
  });
}
