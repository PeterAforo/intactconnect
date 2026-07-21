import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const refTrx = request.nextUrl.searchParams.get("ref_trx");
    const body = await request.json();
    const { status, amount } = body;

    if (refTrx && (status === "success" || status === "completed")) {
      const order = await prisma.resellerOrder.findUnique({
        where: { orderNumber: refTrx },
        include: { items: true },
      });

      if (order && Math.abs(order.total - parseFloat(amount)) < 1) {
        if (order.status === "pending_payment" && order.paymentStatus !== "paid") {
          const products = await prisma.product.findMany({
            where: { id: { in: order.items.map((i) => i.productId) } },
            select: { id: true, stock: true },
          });

          const stockMap = new Map(products.map((p) => [p.id, p.stock]));
          const insufficient = order.items.filter((i) => (stockMap.get(i.productId) || 0) < i.quantity);

          if (insufficient.length > 0) {
            await prisma.resellerOrder.update({
              where: { id: order.id },
              data: {
                paymentStatus: "paid",
                status: "cancelled",
                paidAt: new Date(),
                notes: `Payment received but stock insufficient for: ${insufficient.map((i) => i.productId).join(", ")}. Refund required.`,
              },
            });
            return NextResponse.json({ status: "insufficient_stock" });
          }

          await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }
            await tx.reseller.update({
              where: { id: order.resellerId },
              data: { pendingCommission: { increment: order.commission } },
            });
            await tx.resellerOrder.update({
              where: { id: order.id },
              data: { paymentStatus: "paid", status: "processing", paidAt: new Date() },
            });
          });
          return NextResponse.json({ status: "success" });
        }
      }
    }
    return NextResponse.json({ status: "noted" });
  } catch {
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const refTrx = request.nextUrl.searchParams.get("ref_trx");
  const status = request.nextUrl.searchParams.get("status")?.toLowerCase();
  const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
  const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://www.intactconnect.com.gh";

  if (status === "success" || status === "completed" || status === "paid") {
    const successUrl = new URL("/checkout/success", baseUrl);
    if (refTrx) successUrl.searchParams.set("ref", refTrx);
    successUrl.searchParams.set("method", "canpay");
    return NextResponse.redirect(successUrl.toString());
  }

  const checkoutUrl = new URL("/checkout/success", baseUrl);
  if (refTrx) checkoutUrl.searchParams.set("ref", refTrx);
  checkoutUrl.searchParams.set("method", "canpay");
  checkoutUrl.searchParams.set("status", status || "cancelled");
  return NextResponse.redirect(checkoutUrl.toString());
}
