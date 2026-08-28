import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { requireTeacher } from "@/lib/school/auth";
import { classesForTeacher, unreadCount } from "@/lib/school/data";
import { TEACHER_NAV } from "@/lib/school/navigation";

export const metadata: Metadata = {
  title: { default: "Teacher Portal", template: "%s | Teacher Portal" },
  robots: { index: false, follow: false },
};

const QUICK_NAV = [
  { label: "Home", href: "/portal/teacher", icon: "House" },
  { label: "Classes", href: "/portal/teacher/classes", icon: "School" },
  { label: "Grading", href: "/portal/teacher/grading", icon: "PenSquare" },
  { label: "Register", href: "/portal/teacher/attendance", icon: "CalendarCheck" },
  { label: "Inbox", href: "/portal/teacher/messages", icon: "MessagesSquare" },
];

export default async function TeacherLayout({ children }: LayoutProps<"/portal/teacher">) {
  const user = await requireTeacher();
  const classes = user.teacherId ? classesForTeacher(user.teacherId) : [];

  return (
    <PortalShell
      portalName="Teacher Portal"
      portalHome="/portal/teacher"
      nav={TEACHER_NAV}
      unread={unreadCount(user.id)}
      notificationsHref="/portal/teacher/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: `${classes.length} ${classes.length === 1 ? "class" : "classes"}`,
        avatarSeed: user.avatarSeed,
      }}
    >
      {children}
    </PortalShell>
  );
}
