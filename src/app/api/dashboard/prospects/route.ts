import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const area = url.searchParams.get("area");
  const q = url.searchParams.get("q");
  const type = url.searchParams.get("type");
  const due = url.searchParams.get("due") === "1";

  const where: Record<string, unknown> = { resellerId: reseller!.id };
  if (status && status !== "all") where.status = status;
  if (area) where.area = { contains: area, mode: "insensitive" };
  if (type) where.type = type;
  // Follow-ups due: contacted/interested prospects not touched in 3+ days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const followUpWhere = {
    resellerId: reseller!.id,
    optedOut: false,
    status: { in: ["contacted", "interested", "negotiating"] },
    OR: [
      { lastContactedAt: { lt: threeDaysAgo } },
      { lastContactedAt: null, updatedAt: { lt: threeDaysAgo } },
    ],
  };
  if (due) where.AND = [followUpWhere];
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  const [prospects, counts, followUpsDue] = await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: [{ status: "asc" }, { score: "desc" }, { createdAt: "desc" }],
      include: { activities: { orderBy: { createdAt: "desc" }, take: 1, select: { type: true, createdAt: true } } },
      take: 500,
    }),
    prisma.prospect.groupBy({ by: ["status"], where: { resellerId: reseller!.id }, _count: { id: true } }),
    prisma.prospect.count({ where: followUpWhere }),
  ]);

  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const c of counts) { byStatus[c.status] = c._count.id; total += c._count.id; }

  return NextResponse.json({ prospects, byStatus, total, followUpsDue });
}

export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const body = await request.json();
  const { name } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const phone = body.phone?.trim() || null;
  const email = body.email?.trim() || null;
  const website = body.website?.trim() || null;
  const category = body.category?.trim() || null;
  const score = (phone ? 3 : 0) + (email ? 3 : 0) + (website ? 2 : 0) + 1 + (category ? 1 : 0);

  const prospect = await prisma.prospect.create({
    data: {
      resellerId: reseller!.id,
      name: name.trim(),
      type: body.type === "individual" ? "individual" : "business",
      category, phone, email, website,
      address: body.address || null,
      area: body.area || null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      status: "new",
      score: Math.min(10, score),
      source: "manual",
      tags: body.tags ? JSON.stringify(body.tags) : null,
      notes: body.notes || null,
    },
  });

  await prisma.prospectActivity.create({
    data: { prospectId: prospect.id, type: "system", body: "Prospect added manually" },
  });

  return NextResponse.json(prospect, { status: 201 });
}
