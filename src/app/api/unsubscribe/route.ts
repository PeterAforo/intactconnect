import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unsubscribeToken } from "@/lib/unsubscribe";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const p = url.searchParams.get("p");
  const e = url.searchParams.get("e");
  const t = url.searchParams.get("t");

  const html = (title: string, body: string) =>
    new NextResponse(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#faf9f7;color:#1c1917}
      .card{max-width:420px;text-align:center;padding:40px 32px;background:#fff;border:1px solid #e6e2da;border-radius:16px}
      h1{font-size:20px;margin:0 0 8px}p{font-size:14px;color:#6b665e;line-height:1.6;margin:0}</style></head>
      <body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } });

  if (!p || !e || !t) {
    return html("Invalid link", "This unsubscribe link is incomplete. Please use the link from your email.");
  }

  const prospect = await prisma.prospect.findUnique({ where: { id: p }, select: { id: true, email: true } });
  if (!prospect || prospect.email !== e || unsubscribeToken(p, e) !== t) {
    return html("Link expired", "This unsubscribe link is invalid or has expired.");
  }

  await prisma.prospect.update({ where: { id: p }, data: { optedOut: true } });
  await prisma.prospectActivity.create({
    data: { prospectId: p, type: "system", body: "Unsubscribed from email campaigns" },
  });

  return html("Unsubscribed", "You've been removed from future email campaigns. You can re-subscribe by contacting the sender directly.");
}
