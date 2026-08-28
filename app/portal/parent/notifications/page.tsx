import type { Metadata } from "next";

import { NotificationList } from "@/components/portal/notification-list";
import { PortalPageHeader } from "@/components/portal/page-header";
import { requireUser } from "@/lib/school/auth";
import { getNotifications } from "@/lib/school/data";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = getNotifications(user.id);

  return (
    <>
      <PortalPageHeader
        title="Notifications"
        description="Assignments, results, attendance, fees, messages and school announcements."
      />
      <NotificationList notifications={notifications} />
    </>
  );
}
