import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, email, phone, customerName } = body;

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

    const canpayBaseUrl = process.env.CANPAY_BASE_URL;
    const merchantKey = process.env.CANPAY_MERCHANT_KEY;
    const apiKey = process.env.CANPAY_API_KEY;
    const environment = process.env.CANPAY_ENVIRONMENT || "production";
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://www.intactconnect.com.gh";

    const reference = order.orderNumber;
    const callbackUrl = `${baseUrl}/api/payments/canpay/callback?ref_trx=${encodeURIComponent(reference)}`;

    if (!canpayBaseUrl || !merchantKey || !apiKey) {
      await prisma.resellerOrder.update({
        where: { id: order.id },
        data: { paymentReference: reference, paymentMethod: "canpay" },
      });
      return NextResponse.json({
        success: true,
        message: "Development mode — CanPay credentials not configured",
        redirectUrl: `${baseUrl}/store/${order.reseller.storeSlug}/checkout/success?ref=${reference}&method=canpay`,
        reference,
      });
    }

    const canpayPayload = {
      payment_amount: parseFloat(String(order.total)),
      currency_code: "GHC",
      ref_trx: reference,
      description: `IntactConnect Order #${reference}`,
      callback_url: callbackUrl,
    };

    const canpayResponse = await fetch(`${canpayBaseUrl}/initiate-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Environment": environment,
        "X-Merchant-Key": merchantKey,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(canpayPayload),
    });

    const canpayText = await canpayResponse.text();
    let canpayData;
    try { canpayData = JSON.parse(canpayText); } catch { canpayData = { raw: canpayText }; }

    const redirectUrl =
      canpayData?.payment_url ||
      canpayData?.checkout_url ||
      canpayData?.data?.checkout_url ||
      canpayData?.data?.payment_url ||
      canpayData?.redirect_url ||
      canpayData?.data?.redirect_url;

    if (redirectUrl) {
      await prisma.resellerOrder.update({
        where: { id: order.id },
        data: { paymentReference: reference, paymentMethod: "canpay" },
      });
      return NextResponse.json({ success: true, redirectUrl, reference });
    }

    const apiError = canpayData?.message || canpayData?.error || canpayData?.data?.message || "No checkout URL returned";
    console.error("[CanPay] Error:", canpayResponse.status, canpayData);
    return NextResponse.json({ error: `CanPay error: ${apiError}`, details: canpayData }, { status: 502 });
  } catch (error) {
    console.error("CanPay payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
