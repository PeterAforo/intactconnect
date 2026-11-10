import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import { sendEmail, emailLayout } from "@/lib/email";

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

    // Notify the reseller their store is live
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.intactconnect.com.gh";
    const storeUrl = `${BASE_URL}/store/${reseller.storeSlug}`;
    try {
      await sendEmail(
        reseller.user.email,
        "Your IntactConnect store is live! 🎉",
        emailLayout("You're Approved!", `
          <h2 style="margin:0 0 8px;color:#1a1d23;">Congratulations, ${reseller.user.name}!</h2>
          <p style="color:#666;line-height:1.6;">Your reseller application has been <strong style="color:#10b981;">approved</strong>. Your store is now live and ready to share.</p>
          <div style="background:#f8f9fc;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 4px;color:#888;font-size:12px;">YOUR STORE LINK</p>
            <a href="${storeUrl}" style="color:#7c3aed;font-weight:600;font-size:15px;word-break:break-all;">${storeUrl}</a>
          </div>
          <p style="color:#666;line-height:1.6;font-size:14px;">Share it on WhatsApp, Instagram, anywhere — every sale earns you commission, paid out to your MoMo or bank.</p>
          <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:12px 0;">
            Go to My Dashboard
          </a>
        `),
      );
      console.log("[Approve] Approval email sent to:", reseller.user.email);
    } catch (e) {
      console.error("[Approve] email error:", e);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ reseller });
  } catch (error) {
    console.error("Failed to approve reseller:", error);
    return NextResponse.json({ error: "Failed to approve reseller" }, { status: 500 });
  }
}
