import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { PUPIL_NAV } from "@/lib/school/navigation";

export const metadata: Metadata = {
  title: { default: "Pupil Portal", template: "%s | Pupil Portal" },
  robots: { index: false, follow: false },
};

const QUICK_NAV = [
  { label: "Home", href: "/portal/pupil", icon: "House" },
  { label: "Work", href: "/portal/pupil/assignments", icon: "ClipboardList" },
  { label: "Learn", href: "/portal/pupil/materials", icon: "FolderOpen" },
  { label: "Results", href: "/portal/pupil/results", icon: "Trophy" },
  { label: "Me", href: "/portal/pupil/profile", icon: "UserRound" },
];

export default async function PupilLayout({ children }: LayoutProps<"/portal/pupil">) {
  const user = await requirePupil();
  const [shell, dir] = await Promise.all([query(api.dashboard.shell, {}), getDirectory()]);

  return (
    <PortalShell
      portalName="My School"
      portalHome="/portal/pupil"
      nav={PUPIL_NAV}
      unread={shell?.unread ?? 0}
      notificationsHref="/portal/pupil/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.username ? `@${user.username}` : undefined,
        roleLabel: shell?.pupilClassId ? dir.className(shell.pupilClassId) : "Pupil",
        avatarSeed: user.avatarSeed,
      }}
    >
      {children}
    </PortalShell>
  );
}
