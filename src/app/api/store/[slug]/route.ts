import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { storeSlug: slug, status: "approved" },
    select: { id: true, storeName: true, storeSlug: true, bio: true, picture: true, phone: true, email: true },
  });

  if (!reseller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json(reseller);
}
