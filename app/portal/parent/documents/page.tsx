import type { Metadata } from "next";
import { DownloadIcon, FileTextIcon, ShieldCheckIcon } from "lucide-react";

import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { requireParent } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { fileSize, formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "School documents" };

export default async function ParentDocumentsPage() {
  await requireParent();
  // A parent may see public and parent-visibility documents — never staff-only ones.
  const documents = await query(api.content.portalDocuments, {});

  return (
    <>
      <PortalPageHeader
        title="School documents"
        description="Handbooks, policies, the fee schedule, the academic calendar and termly menus."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="flex h-full flex-col gap-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                <FileTextIcon className="size-5" />
              </span>
              <Badge variant={doc.visibility === "parents" ? "default" : "secondary"} className="font-bold">
                {doc.visibility === "parents" ? "Parents only" : "Public"}
              </Badge>
            </div>
            <h2 className="mt-4 font-heading text-base font-extrabold">{doc.title}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{doc.description}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              PDF · {fileSize(doc.sizeBytes)} · updated {formatDate(doc.updatedAt)}
            </p>
            <Button variant="outline" size="lg" className="mt-4 w-full font-bold" disabled>
              <DownloadIcon />
              Download
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="flex items-start gap-3 text-sm leading-relaxed">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            Parent-only documents are never served from a public folder. In a live deployment each
            download is authorised on the server and delivered through a short-lived signed URL, so a
            link cannot be forwarded or guessed. Downloads are disabled in this demonstration environment.
          </span>
        </p>
      </Card>
    </>
  );
}
