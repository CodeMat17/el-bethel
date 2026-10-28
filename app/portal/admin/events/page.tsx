import type { Metadata } from "next";

import { EventDialog } from "@/components/admin/content-dialogs";
import { EventsManager } from "@/components/portal/events-manager";
import { PortalPageHeader } from "@/components/portal/page-header";
import { requireAdmin } from "@/lib/school/auth";

export const metadata: Metadata = { title: "Events" };

export default async function AdminEventsPage() {
  await requireAdmin();

  return (
    <>
      <PortalPageHeader
        title="Events"
        description="Add, edit and delete school events. Changes show on the public calendar, the events page and the homepage straight away."
        action={<EventDialog />}
      />
      <EventsManager termsHref="/portal/admin/sessions" />
    </>
  );
}
