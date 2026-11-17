import { createHash } from "crypto";

export function trackToken(recipientId: string): string {
  return createHash("sha256")
    .update(`${recipientId}:${process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "intact-track"}`)
    .digest("hex")
    .slice(0, 24);
}

export function validTrackToken(recipientId: string, token: string): boolean {
  return token === trackToken(recipientId);
}
