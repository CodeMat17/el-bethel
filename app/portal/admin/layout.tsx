import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { requireAdmin } from "@/lib/school/auth";
import { unreadCount } from "@/lib/school/data";
import { ROLE_LABELS } from "@/lib/school/config";
import { ADMIN_NAV } from "@/lib/school/navigation";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

const QUICK_NAV = [
  { label: "Home", href: "/portal/admin", icon: "House" },
  { label: "Pupils", href: "/portal/admin/students", icon: "Backpack" },
  { label: "Admissions", href: "/portal/admin/admissions", icon: "FileCheck" },
  { label: "Fees", href: "/portal/admin/fees", icon: "Receipt" },
  { label: "Reports", href: "/portal/admin/reports", icon: "ChartColumn" },
];

export default async function AdminLayout({ children }: LayoutProps<"/portal/admin">) {
  const user = await requireAdmin();

  return (
    <PortalShell
      portalName="Administration"
      portalHome="/portal/admin"
      nav={ADMIN_NAV}
      unread={unreadCount(user.id)}
      notificationsHref="/portal/admin/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: user.roles.map((role) => ROLE_LABELS[role]).join(" · "),
        avatarSeed: user.avatarSeed,
      }}
    >
      {children}
    </PortalShell>
  );
}
