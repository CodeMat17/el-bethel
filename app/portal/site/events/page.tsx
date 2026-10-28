import type { Metadata } from "next";

import { EventDialog } from "@/components/admin/content-dialogs";
import { EventsManager } from "@/components/portal/events-manager";
import { PortalPageHeader } from "@/components/portal/page-header";
import { requireSiteAdmin } from "@/lib/school/auth";

export const metadata: Metadata = { title: "Events" };

export default async function SiteEventsPage() {
  await requireSiteAdmin();

  return (
    <>
      <PortalPageHeader
        title="Events"
        description="The school calendar as published to families, with registration requirements."
        action={<EventDialog />}
      />
      <EventsManager />
    </>
  );
}
