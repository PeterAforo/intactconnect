import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });
    if (existing) {
      return NextResponse.json({ success: true, already: true });
    }

    await prisma.newsletterSubscriber.create({ data: { email: normalized } });

    // Welcome email — non-blocking
    try {
      await sendEmail(
        normalized,
        "You're on the IntactConnect list",
        emailLayout("Welcome", `
          <h2 style="margin:0 0 8px;color:#1a1d23;">You're in! 🎉</h2>
          <p style="color:#666;line-height:1.6;">You'll now get reseller tips, new-product drops, and earning strategies from IntactConnect.</p>
          <p style="color:#666;line-height:1.6;">Ready to start earning? <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://www.intactconnect.com.gh"}/register" style="color:#17140f;font-weight:600;">Create your free reseller account →</a></p>
        `),
      );
    } catch (e) {
      console.error("[Newsletter] welcome email failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Something went wrong — please try again" }, { status: 500 });
  }
}
