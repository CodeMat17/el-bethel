import type { Metadata } from "next";

import { PortalShell } from "@/components/portal/portal-shell";
import { isSuperAdmin, requireSiteAdmin } from "@/lib/school/auth";
import { ROLE_LABELS } from "@/lib/school/config";
import { SITE_NAV } from "@/lib/school/navigation";

export const metadata: Metadata = {
  title: { default: "Site Portal", template: "%s | Site Portal" },
  robots: { index: false, follow: false },
};

const QUICK_NAV = [
  { label: "Home", href: "/portal/site", icon: "LayoutDashboard" },
  { label: "Homepage", href: "/portal/site/edit/home", icon: "House" },
  { label: "Identity", href: "/portal/site/edit/identity", icon: "School" },
];

export default async function SitePortalLayout({ children }: LayoutProps<"/portal/site">) {
  const user = await requireSiteAdmin();

  return (
    <PortalShell
      portalName="Website"
      portalHome="/portal/site"
      nav={
        isSuperAdmin(user)
          ? [...SITE_NAV, { label: "Other portals", items: [{ label: "Administration", href: "/portal/admin", icon: "ShieldCheck" }] }]
          : SITE_NAV
      }
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
