import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const reseller = await prisma.reseller.findUnique({
    where: { userId: user.id },
    select: {
      id: true, storeName: true, storeSlug: true, status: true, picture: true,
      commissionBalance: true, bio: true, phone: true, email: true,
      storeLogo: true, storeBanner: true, storeTagline: true, storeThemeColor: true,
      momoProvider: true, momoNumber: true, bankName: true, bankAccountNumber: true, bankAccountName: true,
    },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    reseller,
  });
}
