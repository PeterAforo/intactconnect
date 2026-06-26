import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, storeName, picture, nationalIdType, nationalIdNumber, nationalIdImage, momoProvider, momoNumber, bankName, bankAccountNumber, bankAccountName } = body;

    // Validate required fields
    if (!name || !email || !password || !phone || !storeName || !picture || !nationalIdType || !nationalIdNumber || !nationalIdImage) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Check store slug uniqueness
    let storeSlug = slugify(storeName);
    const existingSlug = await prisma.reseller.findUnique({ where: { storeSlug } });
    if (existingSlug) {
      storeSlug = `${storeSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user + reseller in a transaction
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: "customer",
        emailVerified: false,
        verifyToken,
        verifyTokenExpiry,
        reseller: {
          create: {
            storeName,
            storeSlug,
            picture,
            phone,
            email,
            nationalIdType,
            nationalIdNumber,
            nationalIdImage,
            momoProvider: momoProvider || null,
            momoNumber: momoNumber || null,
            bankName: bankName || null,
            bankAccountNumber: bankAccountNumber || null,
            bankAccountName: bankAccountName || null,
            status: "pending",
          },
        },
      },
    });

    // Send verification email
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const verifyUrl = `${BASE_URL}/verify-email?token=${verifyToken}`;
    sendEmail(
      email,
      "Verify your IntactConnect account",
      emailLayout("Verify Email", `
        <h2 style="margin:0 0 8px;color:#1a1d23;">Welcome to IntactConnect!</h2>
        <p style="color:#666;line-height:1.6;">Hi <strong>${name}</strong>, click below to verify your email and complete registration.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
          Verify My Email
        </a>
        <p style="color:#999;font-size:13px;margin-top:16px;">After verification, an Intact admin will review and approve your account.</p>
        <p style="color:#999;font-size:13px;">This link expires in 24 hours.</p>
      `),
    ).catch((e) => console.error("[Register] email error:", e));

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail(
        adminEmail,
        `New Reseller Registration: ${name}`,
        emailLayout("New Reseller", `
          <h2 style="margin:0 0 8px;color:#1a1d23;">🆕 New Reseller Registration</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Store:</strong> ${storeName}</p>
          <p><strong>ID Type:</strong> ${nationalIdType}</p>
          <p style="color:#999;font-size:13px;margin-top:16px;">Review and approve at your admin panel.</p>
        `),
      ).catch((e) => console.error("[Register] admin notification error:", e));
    }

    return NextResponse.json({ success: true, userId: user.id, message: "Registration successful! Please check your email to verify your account." });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
