import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { TEACHER_NAV } from "@/lib/school/navigation";

export const metadata: Metadata = {
  title: { default: "Teacher Portal", template: "%s | Teacher Portal" },
  robots: { index: false, follow: false },
};

const QUICK_NAV = [
  { label: "Home", href: "/portal/teacher", icon: "House" },
  { label: "Classes", href: "/portal/teacher/classes", icon: "School" },
  { label: "Marking", href: "/portal/teacher/grading", icon: "PenSquare" },
  { label: "Register", href: "/portal/teacher/attendance", icon: "CalendarCheck" },
  { label: "Results", href: "/portal/teacher/results", icon: "Trophy" },
];

export default async function TeacherLayout({ children }: LayoutProps<"/portal/teacher">) {
  const user = await requireTeacher();
  const shell = await query(api.dashboard.shell, {});
  const classes = shell?.classes ?? 0;

  return (
    <PortalShell
      portalName="Teacher Portal"
      portalHome="/portal/teacher"
      nav={TEACHER_NAV}
      unread={shell?.unread ?? 0}
      notificationsHref="/portal/teacher/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: `${classes} ${classes === 1 ? "class" : "classes"}`,
        avatarSeed: user.avatarSeed,
      }}
    >
      {children}
    </PortalShell>
  );
}
