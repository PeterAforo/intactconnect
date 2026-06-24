import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin(request);
  if (error) return error;

  try {
    const resellers = await prisma.reseller.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ resellers });
  } catch (error) {
    console.error("Failed to fetch resellers:", error);
    return NextResponse.json({ error: "Failed to fetch resellers" }, { status: 500 });
  }
}
