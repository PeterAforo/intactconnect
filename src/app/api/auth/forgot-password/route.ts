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

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const html = emailLayout(
      "Reset Your Password",
      `
      <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;">Password Reset Request</h2>
      <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.6;">
        Hi <strong>${user.name || "there"}</strong>,
      </p>
      <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
        We received a request to reset your IntactConnect password. Click the button below to set a new password:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">
          Reset Password
        </a>
      </div>
      <p style="margin:0 0 8px;color:#888;font-size:12px;line-height:1.5;">
        This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
      </p>
      <p style="margin:16px 0 0;color:#aaa;font-size:11px;">
        Or copy this link: ${resetUrl}
      </p>
      `
    );

    await sendEmail(user.email, "Reset Your IntactConnect Password", html);

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("[Forgot Password]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
