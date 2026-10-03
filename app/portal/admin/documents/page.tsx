import type { Metadata } from "next";
import { FileTextIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { fileSize, formatDate } from "@/lib/school/format";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Documents" };

export default async function AdminDocumentsPage() {
  await requireAdmin();
  const documents = await query(api.content.adminDocuments, {});

  return (
    <>
      <PortalPageHeader
        title="School documents"
        description="Handbooks, policies and schedules, and exactly who each one is visible to."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents" value={documents.length} icon="FileText" tone="info" />
        <StatCard label="Public" value={documents.filter((d) => d.visibility === "public").length} icon="Images" tone="neutral" />
        <StatCard label="Parents only" value={documents.filter((d) => d.visibility === "parents").length} icon="Users" tone="gold" />
        <StatCard label="Staff only" value={documents.filter((d) => d.visibility === "staff").length} icon="ShieldCheck" tone="danger" />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="text-right">Visibility</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <span className="flex items-center gap-3">
                    <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="block font-bold">{doc.title}</span>
                      <span className="block text-xs text-muted-foreground">{doc.description}</span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{doc.category}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{doc.fileName}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {fileSize(doc.sizeBytes)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                  {formatDate(doc.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <StatusPill
                    tone={doc.visibility === "public" ? "neutral" : doc.visibility === "parents" ? "gold" : "danger"}
                  >
                    {doc.visibility}
                  </StatusPill>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        This is the list of school documents and who can see each one. Document file storage is not set up yet —
        share files with families directly until it is.
      </p>
    </>
  );
}
