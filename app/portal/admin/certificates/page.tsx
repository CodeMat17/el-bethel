import Link from "next/link";
import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";

import { CertificateDialog, RevokeCertificateDialog } from "@/components/admin/operations-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { AWARD_CATEGORIES } from "@/lib/school/awards";
import { query } from "@/lib/school/convex";
import { pageParam, paginate, param } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Certificates" };

export default async function AdminCertificatesPage({ searchParams }: PageProps<"/portal/admin/certificates">) {
  await requireAdmin();
  const params = await searchParams;
  const q = param(params.q).trim().toLowerCase();
  const category = param(params.category, "all");
  const [data, dir] = await Promise.all([query(api.awards.adminCertificates, {}), getDirectory()]);
  const classNames = Object.fromEntries(dir.classes.map((c) => [c.id, c.name]));

  const rows = data.certificates.filter((c) => {
    if (category !== "all" && (c.category ?? c.award) !== category) return false;
    return !q || `${c.certificateNo} ${c.studentName} ${c.award}`.toLowerCase().includes(q);
  });
  const paged = paginate(rows, pageParam(params.page), 20);
  const thisSession = data.certificates.filter((c) => c.sessionName === data.sessionName && !c.revokedAt).length;

  return (
    <>
      <PortalPageHeader
        title="Certificates"
        description="Digital certificates with a unique number and a QR code that anyone can scan to confirm they are genuine."
        action={<CertificateDialog classNames={classNames} sessionName={data.sessionName} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Issued" value={data.certificates.length} icon="Award" tone="gold" />
        <StatCard label={`This session (${data.sessionName || "—"})`} value={thisSession} icon="Star" tone="info" />
        <StatCard label="Withdrawn" value={data.certificates.filter((c) => c.revokedAt).length} icon="CircleAlert" tone="neutral" />
      </div>

      <Card className="mb-6 gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by number, pupil or award"
          filters={[{ key: "category", label: "All categories", options: AWARD_CATEGORIES.map((c) => ({ value: c, label: c })) }]}
        />
      </Card>

      {paged.items.length === 0 ? (
        <EmptyState icon="Award" title="No certificates found" description="Issue a certificate, or change the search." />
      ) : (
        <Card className="gap-0 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Pupil</TableHead>
                  <TableHead>Award</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-bold">
                      <Link href={`/verify?no=${c.certificateNo}`} className="hover:underline">
                        {c.certificateNo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">{c.studentName}</span>
                      <span className="block text-xs text-muted-foreground">{dir.className(c.classId)}</span>
                    </TableCell>
                    <TableCell>
                      {c.award}
                      <span className="block text-xs text-muted-foreground">
                        {c.category ?? "—"} · {c.sessionName}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(c.issuedAt)}</TableCell>
                    <TableCell>
                      {c.revokedAt ? (
                        <StatusPill tone="danger">Withdrawn</StatusPill>
                      ) : (
                        <StatusPill tone="success">Valid</StatusPill>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!c.revokedAt ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="font-bold" render={<a href={`/api/certificates/${c.id}`} />}>
                            <DownloadIcon />
                            PDF
                          </Button>
                          <RevokeCertificateDialog id={c.id} certificateNo={c.certificateNo} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{c.revokedReason}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      <Pager
        page={paged.page}
        pageCount={paged.pageCount}
        total={paged.total}
        pageSize={paged.pageSize}
        basePath="/portal/admin/certificates"
        params={{ q: q || undefined, category: category === "all" ? undefined : category }}
      />
    </>
  );
}
