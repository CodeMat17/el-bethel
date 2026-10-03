import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";

/** SHA-256 of this browser's admission-draft secret, if it has one. */
export async function draftTokenHash(): Promise<string | null> {
  const token = (await cookies()).get("eia_application")?.value;
  return token ? createHash("sha256").update(token).digest("hex") : null;
}
