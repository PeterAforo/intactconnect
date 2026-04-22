import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { reseller: { select: { id: true, status: true, storeName: true, storeSlug: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Brute force protection
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Account locked. Try again in ${mins} minutes.` }, { status: 423 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const data: { loginAttempts: number; lockedUntil?: Date } = { loginAttempts: attempts };
      if (attempts >= 5) {
        data.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await prisma.user.update({ where: { id: user.id }, data });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email first", needsVerification: true }, { status: 403 });
    }

    if (!user.reseller) {
      return NextResponse.json({ error: "No reseller account found. Please register as a reseller." }, { status: 403 });
    }

    if (user.reseller.status === "pending") {
      return NextResponse.json({ error: "Your account is awaiting admin approval", status: "pending" }, { status: 403 });
    }

    if (user.reseller.status === "rejected") {
      return NextResponse.json({ error: "Your reseller application was not approved", status: "rejected" }, { status: 403 });
    }

    // Reset login attempts
    await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: 0, lockedUntil: null } });

    const token = await signToken({ userId: user.id });
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        reseller: user.reseller,
      },
    });
    return setAuthCookie(res, token);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
