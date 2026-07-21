import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const HUBTEL_API_URL = "https://payproxyapi.hubtel.com/items/initiate";
const COUNTRY_CODE = "233";

function formatPhone(rawPhone: string): string {
  const cleaned = rawPhone.replace(/\s+/g, "").replace(/^\+/, "");
  if (cleaned.startsWith("0")) return COUNTRY_CODE + cleaned.substring(1);
  if (cleaned.startsWith(COUNTRY_CODE)) return cleaned;
  return COUNTRY_CODE + cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, email, phone, firstName, lastName } = body;

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    const order = await prisma.resellerOrder.findUnique({
      where: { orderNumber },
      include: { reseller: { include: { user: { select: { email: true } } } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment" || order.paymentStatus !== "pending") {
      return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 400 });
    }

    const hubtelAuth = process.env.HUBTEL_AUTH_BASIC;
    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT || "2017118";
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://www.intactconnect.com.gh";

    if (!hubtelAuth) {
      const devRef = `INT-${Date.now()}`;
      await prisma.resellerOrder.update({
        where: { id: order.id },
        data: { paymentReference: devRef, paymentMethod: "hubtel" },
      });
      return NextResponse.json({
        success: true,
        message: "Development mode — Hubtel credentials not configured",
        checkoutUrl: `${baseUrl}/store/${order.reseller.storeSlug}/checkout/success?ref=${order.orderNumber}&method=hubtel`,
        reference: order.orderNumber,
      });
    }

    const clientReference = order.orderNumber;
    const formattedPhone = phone ? formatPhone(phone) : "";
    const paymentLabel = `IntactConnect Order #${order.orderNumber}`;

    const hubtelPayload = {
      totalAmount: parseFloat(String(order.total)),
      description: `Payment for ${paymentLabel}`,
      callbackUrl: `${baseUrl}/api/payments/hubtel/callback`,
      returnUrl: `${baseUrl}/api/payments/hubtel/callback`,
      merchantAccountNumber: merchantAccount,
      cancellationUrl: `${baseUrl}/api/payments/hubtel/callback?clientReference=${encodeURIComponent(order.orderNumber)}&cancelled=1`,
      PayeeMobileNumber: formattedPhone,
      PayeeName: `${firstName || order.shippingName || ""} ${lastName || ""}`.trim(),
      PayeeEmail: email || order.reseller.user.email || "",
      clientReference,
    };

    const hubtelResponse = await fetch(HUBTEL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${hubtelAuth}` },
      body: JSON.stringify(hubtelPayload),
    });

    const hubtelData = await hubtelResponse.json();

    if (hubtelData?.data?.checkoutUrl) {
      await prisma.resellerOrder.update({
        where: { id: order.id },
        data: { paymentReference: clientReference, paymentMethod: "hubtel" },
      });
      return NextResponse.json({
        success: true,
        checkoutUrl: hubtelData.data.checkoutUrl,
        reference: clientReference,
      });
    }

    console.error("Hubtel error response:", hubtelData);
    return NextResponse.json({ error: "Failed to initiate Hubtel payment", details: hubtelData }, { status: 500 });
  } catch (error) {
    console.error("Hubtel payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
