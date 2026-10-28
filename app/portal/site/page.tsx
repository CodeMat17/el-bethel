import Link from "next/link";
import type { Metadata } from "next";
import type { FunctionReturnType } from "convex/server";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";

import { StatusPill } from "@/components/common";
import { Icon } from "@/components/icon";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { requireSiteAdmin } from "@/lib/school/auth";
import { CMS_PAGES, CMS_SETTINGS, CMS_SPECS } from "@/lib/school/cms/editor-spec";
import type { CmsKey } from "@/lib/school/cms/schema";
import { query } from "@/lib/school/convex";
import { formatDateTime } from "@/lib/school/format";
import { SITE_COLLECTIONS } from "@/lib/school/navigation";

export const metadata: Metadata = { title: "Dashboard" };

type Overview = FunctionReturnType<typeof api.cms.overview>;

function DocumentCard({ docKey, overview }: { docKey: CmsKey; overview: Overview }) {
  const spec = CMS_SPECS[docKey];
  const doc = overview.find((d) => d.key === docKey);
  return (
    <Card className="h-full gap-0 p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
          <Icon name={spec.icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-extrabold">{spec.title}</h3>
            {doc?.hasDraft ? (
              <StatusPill tone="gold">Draft</StatusPill>
            ) : doc?.isPublished ? (
              <StatusPill tone="success">Live</StatusPill>
            ) : (
              <StatusPill tone="neutral">Original content</StatusPill>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{spec.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {doc?.hasDraft && doc.draftUpdatedAt
              ? `Draft saved ${formatDateTime(doc.draftUpdatedAt)}${doc.draftUpdatedBy ? ` by ${doc.draftUpdatedBy}` : ""}`
              : doc?.publishedAt
                ? `Published ${formatDateTime(doc.publishedAt)}${doc.publishedBy ? ` by ${doc.publishedBy}` : ""}`
                : "Not edited yet"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" className="font-bold" render={<Link href={`/portal/site/edit/${docKey}`} />}>
          Edit
          <ArrowRightIcon />
        </Button>
        <Button size="sm" variant="ghost" className="font-bold" render={<a href={spec.previewPath} target="_blank" rel="noreferrer" />}>
          View live page
        </Button>
      </div>
    </Card>
  );
}

export default async function SitePortalHome() {
  const user = await requireSiteAdmin();
  const overview = await query(api.cms.overview, {});
  const drafts = overview.filter((d) => d.hasDraft);

  return (
    <>
      <PortalPageHeader
        eyebrow={`Welcome, ${user.name.split(" ")[0]}`}
        title="Website content"
        description="Edit the public website. Page changes are saved as drafts you can preview; nothing goes live until you publish it."
        action={
          <Button variant="outline" size="lg" className="font-bold" render={<a href="/" target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon />
            Open the website
          </Button>
        }
      />

      {drafts.length > 0 ? (
        <div className="mb-6 rounded-xl border border-gold/35 bg-gold/10 px-4 py-3 text-sm">
          <p className="font-bold">Unpublished changes</p>
          <p className="mt-1 text-muted-foreground">
            {drafts.map((d, i) => (
              <span key={d.key}>
                {i > 0 ? ", " : ""}
                <Link href={`/portal/site/edit/${d.key}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
                  {CMS_SPECS[d.key].title}
                </Link>
              </span>
            ))}
          </p>
        </div>
      ) : null}

      <h2 className="mb-3 font-heading text-lg font-extrabold">Pages</h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {CMS_PAGES.map((key) => (
          <li key={key}>
            <DocumentCard docKey={key} overview={overview} />
          </li>
        ))}
      </ul>

      <h2 className="mt-10 mb-3 font-heading text-lg font-extrabold">School details</h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {CMS_SETTINGS.map((key) => (
          <li key={key}>
            <DocumentCard docKey={key} overview={overview} />
          </li>
        ))}
      </ul>

      <h2 className="mt-10 mb-1 font-heading text-lg font-extrabold">Collections</h2>
      <p className="mb-3 text-sm text-muted-foreground">Posts, events, photos and lists. These go live as soon as you save them.</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SITE_COLLECTIONS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-gold/50">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
                <Icon name={item.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-extrabold">{item.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
