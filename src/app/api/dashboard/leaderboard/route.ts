import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const rows = await prisma.resellerOrder.groupBy({
    by: ["resellerId"],
    where: { createdAt: { gte: startOfMonth } },
    _sum: { commission: true },
    orderBy: { _sum: { commission: "desc" } },
  });

  const resellerIds = rows.map((r) => r.resellerId);
  const resellers = await prisma.reseller.findMany({
    where: { id: { in: resellerIds } },
    select: { id: true, storeName: true },
  });
  const nameMap = new Map(resellers.map((r) => [r.id, r.storeName]));

  const board = rows.map((r, i) => ({
    rank: i + 1,
    storeName: nameMap.get(r.resellerId) || "Store",
    commission: Math.round((r._sum.commission || 0) * 100) / 100,
    isYou: r.resellerId === reseller!.id,
  }));

  const myRank = rows.findIndex((r) => r.resellerId === reseller!.id) + 1;

  return NextResponse.json({ board: board.slice(0, 10), myRank: myRank || null });
}
