import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { StatusPage } from "@/components/status-page";
import { api } from "@/convex/_generated/api";
import { getSessionUser, homeForUser, NO_ACCESS } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = {
  title: "No portal access yet",
  robots: { index: false, follow: false },
};

/**
 * Where a signed-in person lands when they have no portal to enter: their sign-in
 * isn't linked to a school account yet, the account has been disabled, or it has
 * no role. Once the school assigns a role, visiting this page sends them on.
 */
export default async function NoAccessPage() {
  const user = await getSessionUser();
  if (user && homeForUser(user) !== NO_ACCESS) redirect(homeForUser(user));

  const status = await query(api.users.provisioningStatus, {});
  const disabled = status.state === "disabled";
  return (
    <StatusPage
      icon="ShieldCheck"
      title={disabled ? "Your account has been disabled" : "You don't have portal access yet"}
      description={
        disabled
          ? "This account can no longer open the portal. If you think this is a mistake, please contact the school office."
          : "You are signed in, but your account has no role yet, so there is no portal to open. Please contact the school office. Once they give your account a role, you'll go straight to your portal."
      }
      actions={[
        { label: "Check again", href: "/portal" },
        { label: "Back to website", href: "/", variant: "outline" },
      ]}
    >
      <SignOutButton className="mt-3 h-11 font-bold" />
    </StatusPage>
  );
}
