import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { PUPIL_NAV } from "@/lib/school/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const [shell, dir] = await Promise.all([query(api.dashboard.shell, {}), getDirectory()]);
  const portal = dir.isSecondaryClass(shell?.pupilClassId) ? "Student Portal" : "Pupil Portal";
  return {
    title: { default: portal, template: `%s | ${portal}` },
    robots: { index: false, follow: false },
  };
}

const QUICK_NAV = [
  { label: "Home", href: "/portal/pupil", icon: "House" },
  { label: "Work", href: "/portal/pupil/assignments", icon: "ClipboardList" },
  { label: "Timetable", href: "/portal/pupil/timetable", icon: "Clock" },
  { label: "Results", href: "/portal/pupil/results", icon: "Trophy" },
  { label: "Me", href: "/portal/pupil/profile", icon: "UserRound" },
];

export default async function PupilLayout({ children }: LayoutProps<"/portal/pupil">) {
  const user = await requirePupil();
  const [shell, dir] = await Promise.all([query(api.dashboard.shell, {}), getDirectory()]);
  const secondary = dir.isSecondaryClass(shell?.pupilClassId);

  return (
    <PortalShell
      portalName={secondary ? "Student Portal" : "My School"}
      portalHome="/portal/pupil"
      nav={PUPIL_NAV}
      unread={shell?.unread ?? 0}
      notificationsHref="/portal/pupil/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.username ? `@${user.username}` : undefined,
        roleLabel: shell?.pupilClassId ? dir.className(shell.pupilClassId) : "Learner",
        avatarSeed: user.avatarSeed,
        photoUrl: user.photoUrl,
      }}
    >
      {children}
    </PortalShell>
  );
}
