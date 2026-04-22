import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { sendEmail, emailLayout } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const invoices = await prisma.invoice.findMany({
    where: { resellerId: reseller!.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, email: true } },
      items: true,
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const { clientId, items, tax, dueDate, notes, sendNow } = await request.json();

  if (!items?.length) return NextResponse.json({ error: "At least one item required" }, { status: 400 });

  const subtotal = items.reduce((s: number, i: { quantity: number; unitPrice: number }) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = tax || 0;
  const total = subtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      resellerId: reseller!.id,
      clientId: clientId || null,
      subtotal,
      tax: taxAmount,
      total,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
      status: sendNow ? "sent" : "draft",
      sentAt: sendNow ? new Date() : null,
      items: {
        create: items.map((i: { productId?: string; description: string; quantity: number; unitPrice: number }) => ({
          productId: i.productId || null,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice,
        })),
      },
    },
    include: { client: { select: { name: true, email: true } }, items: true },
  });

  // Send invoice email if requested
  if (sendNow && invoice.client?.email) {
    try {
      const itemsHtml = invoice.items.map((item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">GH₵${item.unitPrice.toFixed(2)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">GH₵${item.total.toFixed(2)}</td></tr>`
      ).join("");

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
      await sendEmail(
        invoice.client.email,
        `Invoice #${invoice.invoiceNumber} from ${reseller!.storeName}`,
        emailLayout(`Invoice #${invoice.invoiceNumber}`, `
          <h2 style="color:#333">Invoice #${invoice.invoiceNumber}</h2>
          <p>From <strong>${reseller!.storeName}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #333">Description</th><th style="text-align:center;padding:8px;border-bottom:2px solid #333">Qty</th><th style="text-align:right;padding:8px;border-bottom:2px solid #333">Price</th><th style="text-align:right;padding:8px;border-bottom:2px solid #333">Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="font-size:18px;font-weight:bold;color:#333;text-align:right">Total: GH₵${total.toFixed(2)}</p>
          ${dueDate ? `<p style="color:#666">Due: ${new Date(dueDate).toLocaleDateString()}</p>` : ""}
          ${notes ? `<p style="color:#666">Notes: ${notes}</p>` : ""}
          <div style="text-align:center;margin-top:24px">
            <a href="${baseUrl}/invoice/${invoice.id}/pay" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Pay Now</a>
          </div>
        `),
      );
    } catch (e) {
      console.error("Failed to send invoice email:", e);
    }
  }

  return NextResponse.json(invoice, { status: 201 });
}
