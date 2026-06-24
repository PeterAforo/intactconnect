import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await verifyAdmin(request);
  if (error) return error;

  try {
    const reseller = await prisma.reseller.update({
      where: { id: params.id },
      data: { status: "rejected" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ reseller });
  } catch (error) {
    console.error("Failed to reject reseller:", error);
    return NextResponse.json({ error: "Failed to reject reseller" }, { status: 500 });
  }
}
