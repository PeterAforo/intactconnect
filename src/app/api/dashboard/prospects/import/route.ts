import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Bulk-import prospects (from search results or CSV-parsed rows)
export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const { prospects } = await request.json();
  if (!Array.isArray(prospects) || prospects.length === 0) {
    return NextResponse.json({ error: "prospects array required" }, { status: 400 });
  }
  if (prospects.length > 500) {
    return NextResponse.json({ error: "Max 500 per import" }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;

  for (const p of prospects) {
    if (!p.name?.trim()) { skipped++; continue; }
    const phone = p.phone?.trim() || null;
    const email = p.email?.trim() || null;
    const website = p.website?.trim() || null;
    const category = p.category?.trim() || null;
    const score = p.score ?? Math.min(10, (phone ? 3 : 0) + (email ? 3 : 0) + (website ? 2 : 0) + 1 + (category ? 1 : 0));

    try {
      const prospect = await prisma.prospect.create({
        data: {
          resellerId: reseller!.id,
          name: p.name.trim(),
          type: p.type === "individual" ? "individual" : "business",
          category, phone, email, website,
          address: p.address || null,
          area: p.area || null,
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          status: "new",
          score: Math.min(10, score),
          source: p.source || "manual",
          sourceId: p.sourceId || null,
          tags: p.tags ? JSON.stringify(p.tags) : null,
          notes: p.notes || null,
        },
      });
      await prisma.prospectActivity.create({
        data: { prospectId: prospect.id, type: "system", body: `Imported from ${p.source || "manual entry"}` },
      });
      created++;
    } catch {
      skipped++; // unique constraint (dedupe) or validation
    }
  }

  return NextResponse.json({ created, skipped });
}
