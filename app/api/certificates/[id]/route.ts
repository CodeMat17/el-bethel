import { api } from "@/convex/_generated/api";
import { renderCertificatePdf } from "@/lib/school/certificate-pdf";
import { getConvexToken, query } from "@/lib/school/convex";
import { getSchool } from "@/lib/school/site-content";

/**
 * Download a certificate as a PDF. Convex decides who may see it: the pupil,
 * their parents, and staff with access to the pupil.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getConvexToken())) return new Response("Please sign in.", { status: 401 });
  const { id } = await params;

  // Access errors become 401/403/404 responses via Next.js auth interrupts.
  const cert = await query(api.awards.certificate, { id });
  if (!cert) return new Response("Certificate not found.", { status: 404 });
  if (cert.revokedAt) return new Response("This certificate has been withdrawn.", { status: 410 });

  const school = await getSchool();
  const pdf = await renderCertificatePdf({
    certificateNo: cert.certificateNo,
    award: cert.award,
    category: cert.category,
    citation: cert.citation,
    sessionName: cert.sessionName,
    issuedAt: cert.issuedAt,
    studentName: cert.studentName,
    classLabel: cert.classLabel,
  }, school);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.certificateNo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
