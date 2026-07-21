import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ResponseCode, Data } = body;

    if (ResponseCode === "0000" && Data) {
      const { ClientReference, Amount } = Data;
      const order = await prisma.resellerOrder.findUnique({
        where: { orderNumber: ClientReference },
        include: { items: true },
      });

      if (order && Math.abs(order.total - parseFloat(Amount)) < 1) {
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
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
  const params = request.nextUrl.searchParams;
  const clientReference = params.get("clientReference") || params.get("checkoutId") || "";
  const code = params.get("ResponseCode") || params.get("code") || "";
  const status = params.get("status") || "";
  const cancelled = params.get("cancelled") === "1";

  const order = clientReference
    ? await prisma.resellerOrder.findUnique({
        where: { orderNumber: clientReference },
        include: { reseller: { select: { storeSlug: true } } },
      })
    : null;

  const slug = order?.reseller?.storeSlug;
  if (!slug) return NextResponse.redirect(`${baseUrl}/`);

  const isSuccess = !cancelled && (code === "0000" || status.toLowerCase() === "success" || order?.paymentStatus === "paid");

  // Mark the order cancelled if the customer aborted and it was still awaiting payment
  if (!isSuccess && order && order.status === "pending_payment" && order.paymentStatus !== "paid") {
    await prisma.resellerOrder.update({
      where: { id: order.id },
      data: { status: "cancelled", paymentStatus: "failed" },
    });
  }

  const target = new URL(
    isSuccess ? `/store/${slug}/checkout/success` : `/store/${slug}/checkout/cancel`,
    baseUrl
  );
  if (clientReference) target.searchParams.set("ref", clientReference);
  target.searchParams.set("method", "hubtel");
  if (!isSuccess) target.searchParams.set("status", "cancelled");
  return NextResponse.redirect(target.toString());
}
