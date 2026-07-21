import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpiry },
    });

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.intactconnect.com.gh";
    const verifyUrl = `${BASE_URL}/verify-email?token=${verifyToken}`;

    try {
      await sendEmail(
        email,
        "Verify your IntactConnect account",
        emailLayout("Verify Email", `
          <h2 style="margin:0 0 8px;color:#1a1d23;">Verify Your Email</h2>
          <p style="color:#666;line-height:1.6;">Hi <strong>${user.name}</strong>, click below to verify your email and complete registration.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
            Verify My Email
          </a>
          <p style="color:#999;font-size:13px;margin-top:16px;">This link expires in 24 hours.</p>
        `),
      );
      console.log("[Resend] Verification email sent to:", email);
    } catch (e) {
      console.error("[Resend] email error:", e);
      return NextResponse.json({ error: "Failed to send verification email. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Verification email sent! Check your inbox." });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to resend verification" }, { status: 500 });
  }
}
