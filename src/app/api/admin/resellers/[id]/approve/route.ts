import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { error } = await verifyAdmin(request);
  if (error) return error;

  const { id } = await context.params;

  try {
    const reseller = await prisma.reseller.update({
      where: { id },
      data: { status: "approved" },
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
    console.error("Failed to approve reseller:", error);
    return NextResponse.json({ error: "Failed to approve reseller" }, { status: 500 });
  }
}
