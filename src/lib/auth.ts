import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "intactconnect-secret-key");
const COOKIE_NAME = "ic_token";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  resellerId?: string;
}

export async function signToken(payload: { userId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, reseller: { select: { id: true, status: true } } },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      resellerId: user.reseller?.id,
    };
  } catch {
    return null;
  }
}

export async function verifyReseller(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null, reseller: null };
  }
  const reseller = await prisma.reseller.findUnique({ where: { userId: user.id } });
  if (!reseller || reseller.status !== "approved") {
    return { error: NextResponse.json({ error: "Reseller not approved" }, { status: 403 }), user, reseller: null };
  }
  return { error: null, user, reseller };
}
