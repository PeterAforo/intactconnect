import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { sendEmail, emailLayout } from "@/lib/email";

/**
 * Upgrade an existing (verified) User account into a reseller.
 * For intactghana.com customers who share the same User table —
 * they log in with existing credentials, then complete this KYC form.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { reseller: { select: { id: true } } },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.reseller) {
      return NextResponse.json({ error: "You already have a reseller account" }, { status: 409 });
    }
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email first", needsVerification: true }, { status: 403 });
    }

    const body = await request.json();
    const { storeName, picture, nationalIdType, nationalIdNumber, nationalIdImage, momoProvider, momoNumber, bankName, bankAccountNumber, bankAccountName, ref } = body;

    if (!storeName || !picture || !nationalIdType || !nationalIdNumber || !nationalIdImage) {
      return NextResponse.json({ error: "Store name, photo, and national ID details are required" }, { status: 400 });
    }

    let storeSlug = slugify(storeName);
    const existingSlug = await prisma.reseller.findUnique({ where: { storeSlug } });
    if (existingSlug) {
      storeSlug = `${storeSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    // Resolve referral code
    let referredById: string | null = null;
    if (ref && typeof ref === "string") {
      const referrer = await prisma.reseller.findUnique({
        where: { referralCode: ref.trim().toLowerCase() },
        select: { id: true },
      });
      if (referrer) referredById = referrer.id;
    }

    const reseller = await prisma.reseller.create({
      data: {
        userId: user.id,
        storeName,
        storeSlug,
        picture,
        phone: user.phone || "",
        email: user.email,
        nationalIdType,
        nationalIdNumber,
        nationalIdImage,
        momoProvider: momoProvider || null,
        momoNumber: momoNumber || null,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountName: bankAccountName || null,
        referredById,
        status: "pending",
      },
    });

    // Notify admin (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendEmail(
          adminEmail,
          `Reseller Upgrade Request: ${user.name}`,
          emailLayout("Reseller Upgrade", `
            <h2 style="margin:0 0 8px;color:#1a1d23;">🆕 Existing Customer → Reseller</h2>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Store:</strong> ${storeName}</p>
            <p><strong>ID Type:</strong> ${nationalIdType}</p>
            <p style="color:#999;font-size:13px;margin-top:16px;">This customer already has a verified account — review and approve at your admin panel.</p>
          `),
        );
      } catch (e) {
        console.error("[BecomeReseller] admin notification error:", e);
      }
    }

    return NextResponse.json({ success: true, resellerId: reseller.id });
  } catch (error) {
    console.error("Become reseller error:", error);
    return NextResponse.json({ error: "Failed to submit reseller application" }, { status: 500 });
  }
}
