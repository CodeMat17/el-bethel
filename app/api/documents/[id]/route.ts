import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";

/**
 * Open a school document. Convex decides who may see it (public documents are
 * open to everyone; parent and staff ones need the right sign-in) and the file
 * is streamed through here, so its storage URL never reaches the browser.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Access errors become 401/403/404 responses via Next.js auth interrupts.
  const file = await query(api.content.documentFile, { id });
  if (!file) return new Response("This document isn't available yet.", { status: 404 });

  const upstream = await fetch(file.url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return new Response("Could not load the document. Please try again.", { status: 502 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${file.fileName.replace(/"/g, "")}"`,
      "Cache-Control": file.visibility === "public" ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
