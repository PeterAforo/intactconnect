import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const body = await request.json();

  const allowed = [
    "storeName", "bio", "storeTagline", "storeThemeColor",
    "storeLogo", "storeBanner", "phone", "email",
    "momoProvider", "momoNumber", "bankName", "bankAccountNumber", "bankAccountName",
  ];

  const data: Record<string, string | null> = {};
  for (const key of allowed) {
    if (key in body) {
      data[key] = body[key] || null;
    }
  }

  // storeName is required - can't be null
  if ("storeName" in data && !data.storeName) {
    return NextResponse.json({ error: "Store name is required" }, { status: 400 });
  }

  const updated = await prisma.reseller.update({
    where: { id: reseller!.id },
    data,
    select: {
      id: true, storeName: true, storeSlug: true, bio: true, phone: true, email: true,
      storeLogo: true, storeBanner: true, storeTagline: true, storeThemeColor: true,
      momoProvider: true, momoNumber: true, bankName: true, bankAccountNumber: true, bankAccountName: true,
    },
  });

  return NextResponse.json(updated);
}
