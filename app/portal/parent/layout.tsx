import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { requireParent } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { PARENT_NAV } from "@/lib/school/navigation";

export const metadata: Metadata = {
  title: { default: "Parent Portal", template: "%s | Parent Portal" },
  robots: { index: false, follow: false },
};

const QUICK_NAV = [
  { label: "Home", href: "/portal/parent", icon: "House" },
  { label: "Work", href: "/portal/parent/assignments", icon: "ClipboardList" },
  { label: "Results", href: "/portal/parent/results", icon: "Trophy" },
  { label: "Fees", href: "/portal/parent/fees", icon: "Receipt" },
  { label: "Messages", href: "/portal/parent/messages", icon: "MessagesSquare" },
];

export default async function ParentLayout({ children }: LayoutProps<"/portal/parent">) {
  const user = await requireParent();
  const shell = await query(api.dashboard.shell, {});
  const count = shell?.children ?? 0;

  return (
    <PortalShell
      portalName="Parent Portal"
      portalHome="/portal/parent"
      nav={PARENT_NAV}
      unread={shell?.unread ?? 0}
      notificationsHref="/portal/parent/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: `${count} ${count === 1 ? "child" : "children"} enrolled`,
        avatarSeed: user.avatarSeed,
      }}
    >
      {children}
    </PortalShell>
  );
}
