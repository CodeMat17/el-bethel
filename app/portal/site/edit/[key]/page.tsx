import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsEditor } from "@/components/cms/editor";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { requireSiteAdmin } from "@/lib/school/auth";
import { CMS_SPECS } from "@/lib/school/cms/editor-spec";
import { isCmsKey } from "@/lib/school/cms/schema";
import { query } from "@/lib/school/convex";

export async function generateMetadata({ params }: PageProps<"/portal/site/edit/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: isCmsKey(key) ? CMS_SPECS[key].title : "Not found" };
}

export default async function EditSiteDocument({ params }: PageProps<"/portal/site/edit/[key]">) {
  await requireSiteAdmin();
  const { key } = await params;
  if (!isCmsKey(key)) notFound();

  const spec = CMS_SPECS[key];
  const doc = await query(api.cms.editor, { key });

  return (
    <>
      <PortalPageHeader
        title={spec.title}
        description={spec.description}
        breadcrumb={[
          { label: "Website", href: "/portal/site" },
          { label: spec.title, href: `/portal/site/edit/${key}` },
        ]}
      />
      <CmsEditor
        spec={spec}
        initial={doc.value}
        status={{
          hasDraft: doc.hasDraft,
          isPublished: doc.isPublished,
          publishedAt: doc.publishedAt,
          publishedBy: doc.publishedBy,
          draftUpdatedAt: doc.draftUpdatedAt,
          draftUpdatedBy: doc.draftUpdatedBy,
          versions: doc.versions,
        }}
      />
    </>
  );
}
