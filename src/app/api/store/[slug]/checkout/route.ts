import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { items, shipping, name, email, phone, address, city, region, paymentMethod, notes } = body;

    if (!items?.length || !name || !phone || !address || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the reseller
    const reseller = await prisma.reseller.findUnique({
      where: { storeSlug: slug, status: "approved" },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!reseller) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Validate products and get margins
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, categoryId: true, stock: true },
    });

    const margins = await prisma.categoryMargin.findMany({ select: { categoryId: true, marginPercent: true } });
    const marginMap = new Map(margins.map((m) => [m.categoryId, m.marginPercent]));

    let subtotal = 0;
    let totalCommission = 0;
    const orderItems: { productId: string; quantity: number; price: number; commission: number }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }

      const margin = marginMap.get(product.categoryId) || 0;
      const resellerPrice = Math.ceil(product.price * (1 + margin / 100));
      const commission = (resellerPrice - product.price) * item.quantity;
      subtotal += resellerPrice * item.quantity;
      totalCommission += commission;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: resellerPrice,
        commission,
      });
    }

    const total = subtotal + (shipping || 0);
    const orderNumber = generateOrderNumber();

    // Create client if email provided
    let clientId: string | undefined;
    if (email || phone) {
      const existingClient = await prisma.resellerClient.findFirst({
        where: { resellerId: reseller.id, OR: [{ email: email || undefined }, { phone }] },
      });
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const newClient = await prisma.resellerClient.create({
          data: { resellerId: reseller.id, name, email: email || null, phone, address, city, region: region || null },
        });
        clientId = newClient.id;
      }
    }

    // Create order + items + update stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const ord = await tx.resellerOrder.create({
        data: {
          orderNumber,
          resellerId: reseller.id,
          clientId: clientId || null,
          subtotal,
          shipping: shipping || 0,
          total,
          commission: totalCommission,
          paymentMethod,
          shippingName: name,
          shippingPhone: phone,
          shippingAddress: address,
          shippingCity: city,
          shippingRegion: region || null,
          notes: notes || null,
          items: { create: orderItems },
        },
      });

      // Decrease stock
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Add commission to reseller balance
      await tx.reseller.update({
        where: { id: reseller.id },
        data: { commissionBalance: { increment: totalCommission } },
      });

      return ord;
    });

    // Send email notification to reseller
    try {
      const itemsHtml = orderItems.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${product?.name || "Product"}</td><td style="padding:8px;border-bottom:1px solid #eee">x${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee">GH₵${(item.price * item.quantity).toFixed(2)}</td></tr>`;
      }).join("");

      await sendEmail(
        reseller.user.email,
        `New Order #${orderNumber}`,
        emailLayout(`New Order #${orderNumber}`, `
          <h2 style="color:#333">New Order Received!</h2>
          <p>Order <strong>#${orderNumber}</strong> from <strong>${name}</strong> (${phone})</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0"><thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #333">Item</th><th style="text-align:left;padding:8px;border-bottom:2px solid #333">Qty</th><th style="text-align:left;padding:8px;border-bottom:2px solid #333">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
          <p style="font-size:18px;font-weight:bold;color:#333">Total: GH₵${total.toFixed(2)}</p>
          <p style="color:#22c55e;font-weight:bold">Commission earned: GH₵${totalCommission.toFixed(2)}</p>
          <p>Delivery to: ${address}, ${city}${region ? `, ${region}` : ""}</p>
        `),
      );
    } catch {
      // Non-critical, don't fail the order
    }

    return NextResponse.json({ success: true, orderNumber: order.orderNumber, orderId: order.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
