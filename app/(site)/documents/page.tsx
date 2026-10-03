import Link from "next/link";
import type { Metadata } from "next";
import { DownloadIcon, FileTextIcon, LockIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPublicDocuments } from "@/lib/school/site-data";
import { fileSize, formatDate } from "@/lib/school/format";
import { getPublicCatalogue, verifyCertificate } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "School Documents",
  description:
    "Download the El-Bethel International Academy handbook, prospectus, fee schedule, academic calendar, uniform guide and admission requirements.",
  alternates: { canonical: "/documents" },
};

export default async function DocumentsPage() {
  const publicDocs = await getPublicDocuments();
  const restricted = (await getPublicCatalogue()).restrictedDocuments;

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="School Documents"
        lede="Everything a prospective or current family needs, in one place. Private documents require a portal sign-in."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Documents", href: "/documents" }]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Public" title="Available to everyone" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicDocs.map((doc, i) => (
              <Reveal key={doc.id} delay={i * 0.04}>
                <Card className="flex h-full flex-col gap-0 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                      <FileTextIcon className="size-5" />
                    </span>
                    <Badge variant="secondary" className="font-bold">{doc.category}</Badge>
                  </div>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{doc.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{doc.description}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    PDF · {fileSize(doc.sizeBytes)} · updated {formatDate(doc.updatedAt)}
                  </p>
                  <Button variant="outline" size="lg" className="mt-4 w-full font-bold" disabled>
                    <DownloadIcon />
                    Download
                  </Button>
                </Card>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Downloads are disabled in this demonstration environment — no document files are bundled with
            the build. In a live deployment each file is served from private object storage behind a
            signed, short-lived URL.
          </p>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Private"
            title="Available after signing in"
            lede="Parent and staff documents are never served publicly. Access is checked on the server on every request."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restricted.map((doc, i) => (
              <Reveal key={doc.id} delay={i * 0.04}>
                <Card className="flex h-full flex-col gap-0 border-dashed p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
                      <LockIcon className="size-5" />
                    </span>
                    <Badge variant="outline" className="font-bold capitalize">{doc.visibility}</Badge>
                  </div>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{doc.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{doc.description}</p>
                  <Button size="lg" className="mt-4 w-full font-bold" render={<Link href="/login" />}>
                    Sign in to access
                  </Button>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
