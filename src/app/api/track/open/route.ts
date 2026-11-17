import { prisma } from "@/lib/db";
import { validTrackToken } from "@/lib/track";

export const dynamic = "force-dynamic";

const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const t = searchParams.get("t") || "";

  if (id && t && validTrackToken(id, t)) {
    try {
      await prisma.campaignRecipient.updateMany({
        where: { id, status: { in: ["pending", "sent"] } },
        data: { status: "opened" },
      });
    } catch { /* tracking must never break the pixel */ }
  }

  return new Response(GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
