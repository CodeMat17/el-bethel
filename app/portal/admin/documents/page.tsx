import type { Metadata } from "next";
import { ExternalLinkIcon, FileTextIcon, TrashIcon } from "lucide-react";

import { DocumentDialog } from "@/components/admin/content-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { removeDocument } from "@/lib/school/actions/admin";
import { fileSize, formatDate } from "@/lib/school/format";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Documents" };

const DEFAULT_CATEGORIES = ["Handbook", "Policy", "Fees", "Calendar", "Admissions", "Menu", "Forms"];

export default async function AdminDocumentsPage() {
  await requireAdmin();
  const documents = await query(api.content.adminDocuments, {});
  const categories = [...new Set([...documents.map((d) => d.category), ...DEFAULT_CATEGORIES])];

  return (
    <>
      <PortalPageHeader
        title="School documents"
        description="Upload handbooks, policies and schedules as PDFs, and choose who can see each one. Public documents appear on the website's Documents page; parent documents in the parent portal."
        action={<DocumentDialog categories={categories} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents" value={documents.length} icon="FileText" tone="info" />
        <StatCard label="Public" value={documents.filter((d) => d.visibility === "public").length} icon="Images" tone="neutral" />
        <StatCard label="Parents only" value={documents.filter((d) => d.visibility === "parents").length} icon="Users" tone="gold" />
        <StatCard
          label="Missing a file"
          value={documents.filter((d) => !d.storageId).length}
          icon="CircleAlert"
          tone={documents.some((d) => !d.storageId) ? "warning" : "success"}
        />
      </div>

      {documents.length === 0 ? (
        <EmptyState icon="FileText" title="No documents yet" description="Add the first PDF with the button above." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Visibility</TableHead>
                <TableHead className="text-right" />
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
                  <TableCell className="text-xs text-muted-foreground">
                    {doc.storageId ? (
                      <>
                        <span className="block font-mono">{doc.fileName}</span>
                        <span className="block">{fileSize(doc.sizeBytes)}</span>
                      </>
                    ) : (
                      <StatusPill tone="warning">No file uploaded</StatusPill>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground">{formatDate(doc.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <StatusPill tone={doc.visibility === "public" ? "neutral" : doc.visibility === "parents" ? "gold" : "danger"}>
                      {doc.visibility}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <DocumentDialog doc={doc} categories={categories} />
                      {doc.storageId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-bold"
                          render={<a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" />}
                        >
                          <ExternalLinkIcon />
                          Open
                        </Button>
                      ) : null}
                      <ConfirmAction
                        action={removeDocument.bind(null, doc.id)}
                        icon={<TrashIcon />}
                        variant="ghost"
                        className="font-bold text-destructive"
                        pendingText="Deleting…"
                        destructive
                        confirm={{ title: "Delete this document?", description: "The PDF is deleted too. Families will no longer see it.", confirmLabel: "Delete" }}
                      >
                        Delete
                      </ConfirmAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
