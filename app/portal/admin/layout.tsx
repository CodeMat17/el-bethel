import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { isSuperAdmin, requireAdmin } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
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
  { label: "Results", href: "/portal/admin/results", icon: "Trophy" },
];

export default async function AdminLayout({ children }: LayoutProps<"/portal/admin">) {
  const user = await requireAdmin();
  const shell = await query(api.dashboard.shell, {});

  return (
    <PortalShell
      portalName="Administration"
      portalHome="/portal/admin"
      nav={
        isSuperAdmin(user)
          ? [...ADMIN_NAV, { label: "Website", items: [{ label: "Site portal", href: "/portal/site", icon: "Newspaper" }] }]
          : ADMIN_NAV
      }
      unread={shell?.unread ?? 0}
      notificationsHref="/portal/admin/notifications"
      quickNav={QUICK_NAV}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: user.roles.map((role) => ROLE_LABELS[role]).join(" · "),
        avatarSeed: user.avatarSeed,
        photoUrl: user.photoUrl,
      }}
    >
      {children}
    </PortalShell>
  );
}
