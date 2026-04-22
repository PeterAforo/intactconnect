import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: { verifyToken: token, verifyTokenExpiry: { gt: new Date() } },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
    });

    const jwt = await signToken({ userId: user.id });
    const res = NextResponse.json({ success: true });
    return setAuthCookie(res, jwt);
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
