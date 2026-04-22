import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const promotions = await prisma.resellerPromotion.findMany({
    where: { resellerId: reseller!.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(promotions);
}

export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const { title, description, image, discount, code, startDate, endDate } = await request.json();
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "Title, start date, and end date are required" }, { status: 400 });
  }

  const promo = await prisma.resellerPromotion.create({
    data: {
      resellerId: reseller!.id,
      title,
      description: description || null,
      image: image || null,
      discount: discount ? parseFloat(discount) : null,
      code: code || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json(promo, { status: 201 });
}
