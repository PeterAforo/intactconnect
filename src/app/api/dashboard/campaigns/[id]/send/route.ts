import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendCampaign } from "@/lib/campaign-send";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  // Ownership check — sendCampaign itself is not reseller-scoped
  const owned = await prisma.campaign.findFirst({
    where: { id, resellerId: reseller!.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await sendCampaign(id);
  if (result.skipped) {
    return NextResponse.json({ error: result.status === "missing" ? "Not found" : "Already sent" }, { status: result.status === "missing" ? 404 : 400 });
  }
  return NextResponse.json(result);
}
