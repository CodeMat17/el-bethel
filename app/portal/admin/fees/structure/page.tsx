import type { Metadata } from "next";

import { CmsEditor } from "@/components/cms/editor";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { CMS_SPECS } from "@/lib/school/cms/editor-spec";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Fee structure" };

/** The same fee table the Site portal edits: termly fees, the application fee and other one-off fees, open classes. */
export default async function AdminFeeStructurePage() {
  await requireAdmin();
  const spec = CMS_SPECS.fees;
  const doc = await query(api.cms.editor, { key: "fees" });

  return (
    <>
      <PortalPageHeader
        title="Fee structure & admission rules"
        description="Termly fees, the application fee and other one-off charges, optional services, open classes and required documents. Save a draft, preview it, then publish — the website and the application form follow the published version."
        breadcrumb={[
          { label: "Fees & invoices", href: "/portal/admin/fees" },
          { label: "Fee structure", href: "/portal/admin/fees/structure" },
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
