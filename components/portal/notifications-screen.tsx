import { NotificationList } from "@/components/portal/notification-list";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { requireUser } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { EMAILED_TYPES } from "@/lib/school/email-notifications";

/** The notification centre shared by every portal. */
export async function NotificationsScreen({ children, showEmailNote = true }: { children?: React.ReactNode; showEmailNote?: boolean }) {
  const user = await requireUser();
  const notifications = await query(api.notifications.mine, { limit: 100 });
  const adult = user.roles.some((r) => r !== "pupil");

  return (
    <>
      <PortalPageHeader title="Notifications" description="Assignments, results, attendance, fees, messages and school announcements." />
      {children}
      <NotificationList notifications={notifications} />
      {showEmailNote && adult ? (
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Every notice appears here. We also email you about: {Object.values(EMAILED_TYPES).join(", ").toLowerCase()}.
        </p>
      ) : null}
    </>
  );
}
