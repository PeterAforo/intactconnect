import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scrapeWebsiteEmail } from "@/lib/prospecting";

// Best-effort email enrichment from the prospect's website
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({ where: { id, resellerId: reseller!.id } });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (prospect.email) return NextResponse.json({ prospect, note: "Already has email" });
  if (!prospect.website) return NextResponse.json({ error: "No website to scrape" }, { status: 400 });

  const email = await scrapeWebsiteEmail(prospect.website);
  if (!email) {
    await prisma.prospectActivity.create({
      data: { prospectId: id, type: "system", body: "Email enrichment attempted — none found on website" },
    });
    return NextResponse.json({ prospect, note: "No email found on website" });
  }

  const updated = await prisma.prospect.update({
    where: { id },
    data: { email, score: { increment: 3 } },
  });
  await prisma.prospectActivity.create({
    data: { prospectId: id, type: "system", body: `Email found via website: ${email}` },
  });
  return NextResponse.json({ prospect: updated, email });
}
