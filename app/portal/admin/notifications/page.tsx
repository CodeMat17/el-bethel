import type { Metadata } from "next";

import { NotificationList } from "@/components/portal/notification-list";
import { PortalPageHeader } from "@/components/portal/page-header";
import { requireAdmin } from "@/lib/school/auth";
import { getNotifications } from "@/lib/school/data";

export const metadata: Metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  const user = await requireAdmin();
  return (
    <>
      <PortalPageHeader
        title="Notifications"
        description="Admissions, finance and operational alerts for your account."
      />
      <NotificationList notifications={getNotifications(user.id)} />
    </>
  );
}
