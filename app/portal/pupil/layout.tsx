import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { requirePupil } from "@/lib/school/auth";
import { classDisplayName, getStudent, unreadCount } from "@/lib/school/data";
import { PUPIL_NAV } from "@/lib/school/navigation";

export const metadata: Metadata = {
  title: { default: "Pupil Portal", template: "%s | Pupil Portal" },
  robots: { index: false, follow: false },
};

const QUICK_NAV = [
  { label: "Home", href: "/portal/pupil", icon: "House" },
  { label: "Work", href: "/portal/pupil/assignments", icon: "ClipboardList" },
  { label: "Learn", href: "/portal/pupil/materials", icon: "FolderOpen" },
  { label: "Quiz", href: "/portal/pupil/quizzes", icon: "Puzzle" },
  { label: "Me", href: "/portal/pupil/profile", icon: "UserRound" },
];

export default async function PupilLayout({ children }: LayoutProps<"/portal/pupil">) {
  const user = await requirePupil();
  const student = user.studentId ? getStudent(user.studentId) : null;

  return (
    <PortalShell
      portalName="My School"
      portalHome="/portal/pupil"
      nav={PUPIL_NAV}
      unread={unreadCount(user.id)}
      notificationsHref="/portal/pupil/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: student ? classDisplayName(student.classId) : "Pupil",
        avatarSeed: user.avatarSeed,
      }}
    >
      {children}
    </PortalShell>
  );
}
