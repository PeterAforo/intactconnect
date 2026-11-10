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

    // Notify the applicant — non-blocking
    try {
      await sendEmail(
        reseller.user.email,
        "Update on your IntactConnect application",
        emailLayout("Application Update", `
          <h2 style="margin:0 0 8px;color:#1a1d23;">Hi ${reseller.user.name},</h2>
          <p style="color:#666;line-height:1.6;">Thank you for applying to become an IntactConnect reseller. After reviewing your application, we're unable to approve it at this time.</p>
          <p style="color:#666;line-height:1.6;">If you believe this was a mistake or you'd like to reapply with updated information, please contact us and we'll be happy to help.</p>
          <p style="color:#666;line-height:1.6;">WhatsApp/Call: <a href="tel:+233543645126" style="color:#7c3aed;">+233 543 645 126</a></p>
        `),
      );
    } catch (e) {
      console.error("[Reject] email error:", e);
    }

    return NextResponse.json({ reseller });
  } catch (error) {
    console.error("Failed to reject reseller:", error);
    return NextResponse.json({ error: "Failed to reject reseller" }, { status: 500 });
  }
}
