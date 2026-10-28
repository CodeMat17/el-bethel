import { BanIcon, CircleCheckIcon } from "lucide-react";

import { CreateLoginDialog, ResetPasswordDialog, SendInviteButton } from "@/components/admin/account-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { setAccountActive } from "@/lib/school/actions/admin";
import { formatDate } from "@/lib/school/format";
import type { User } from "@/lib/school/types";

/** Sign-in status for a pupil, parent or teacher record, with create/reset/disable actions. */
export function SignInCard({
  kind,
  name,
  email,
  profileId,
  account,
  canGrantAdmin,
  usernameSuffix,
}: {
  kind: "pupil" | "parent" | "teacher";
  name: string;
  email?: string;
  profileId: string;
  account: User | null;
  canGrantAdmin: boolean;
  usernameSuffix?: string;
}) {
  return (
    <Card className="gap-0 p-5 sm:p-6">
      <h2 className="font-heading text-base font-extrabold">Sign-in</h2>
      <Separator className="my-4" />
      {account?.clerkUserId ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm font-bold">@{account.username}</p>
            <p className="text-xs text-muted-foreground">
              {account.active ? "Can sign in" : "Disabled"} · last seen {account.lastLoginAt ? formatDate(account.lastLoginAt) : "never"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {kind !== "pupil" && !account.lastLoginAt ? <SendInviteButton userId={account.id} name={name} /> : null}
            <ResetPasswordDialog userId={account.id} name={name} />
            {account.active ? (
              <ConfirmAction
                action={setAccountActive.bind(null, account.id, false)}
                icon={<BanIcon />}
                variant="ghost"
                className="font-bold text-destructive"
                pendingText="Disabling…"
                destructive
                confirm={{ title: "Disable this sign-in?", description: "They will be signed out everywhere and can't sign in.", confirmLabel: "Disable" }}
              >
                Disable
              </ConfirmAction>
            ) : (
              <ConfirmAction action={setAccountActive.bind(null, account.id, true)} icon={<CircleCheckIcon />} variant="ghost" pendingText="Enabling…">
                Enable
              </ConfirmAction>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">No sign-in yet.</p>
          <CreateLoginDialog
            kind={kind}
            name={name}
            email={email}
            profileId={profileId}
            userId={account?.id}
            usernameSuffix={usernameSuffix}
            canGrantAdmin={canGrantAdmin}
          />
        </div>
      )}
    </Card>
  );
}
