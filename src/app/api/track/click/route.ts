import { prisma } from "@/lib/db";
import { validTrackToken } from "@/lib/track";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const t = searchParams.get("t") || "";
  const u = searchParams.get("u") || "";

  // Only allow http(s) redirect targets
  let dest = "https://www.intactconnect.com.gh";
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") dest = parsed.toString();
  } catch { /* keep default */ }

  if (id && t && validTrackToken(id, t)) {
    try {
      await prisma.campaignRecipient.updateMany({
        where: { id, status: { in: ["pending", "sent", "opened"] } },
        data: { status: "clicked" },
      });
    } catch { /* tracking must never break the redirect */ }
  }

  return Response.redirect(dest, 302);
}
