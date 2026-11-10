import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_TYPES = new Set(["store_view", "product_view", "share_click"]);

/**
 * Fire-and-forget analytics tracking for reseller storefronts.
 * Public — dedupe is handled client-side via sessionKey.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const { type, productId, sessionKey } = body;

    if (!type || !VALID_TYPES.has(type) || !sessionKey || typeof sessionKey !== "string" || sessionKey.length > 64) {
      return NextResponse.json({ ok: true });
    }

    const reseller = await prisma.reseller.findUnique({
      where: { storeSlug: slug, status: "approved" },
      select: { id: true },
    });
    if (!reseller) return NextResponse.json({ ok: true });

    // Skip if this session+type was already recorded (server-side dedupe guard)
    const dupe = await prisma.storeEvent.findFirst({
      where: { resellerId: reseller.id, type, sessionKey, productId: productId || null },
      select: { id: true },
    });
    if (!dupe) {
      await prisma.storeEvent.create({
        data: { resellerId: reseller.id, type, productId: productId || null, sessionKey },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
