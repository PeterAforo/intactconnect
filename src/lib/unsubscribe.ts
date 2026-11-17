import { createHash } from "crypto";

export function unsubscribeToken(prospectId: string, email: string): string {
  return createHash("sha256")
    .update(`${prospectId}:${email}:${process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "intact-unsubscribe"}`)
    .digest("hex")
    .slice(0, 24);
}
