import type { Metadata } from "next";
import { ShieldCheckIcon } from "lucide-react";

import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { requireParent } from "@/lib/school/auth";
import { ROLE_LABELS } from "@/lib/school/config";
import { childrenForSession, classDisplayName, getParent, studentName } from "@/lib/school/data";
import { avatarTone, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

const PREFERENCES = [
  { key: "email", label: "Email notifications", detail: "Assignment updates, results and fee reminders", on: true },
  { key: "sms", label: "SMS alerts", detail: "Attendance alerts and urgent school notices only", on: true },
  { key: "push", label: "Push notifications", detail: "Requires installing the app to your home screen", on: false },
  { key: "digest", label: "Weekly summary", detail: "A Friday summary of the week's work and attendance", on: true },
];

export default async function ParentProfilePage() {
  const user = await requireParent();
  const parent = user.parentId ? getParent(user.parentId) : null;
  const myChildren = childrenForSession(user);

  return (
    <>
      <PortalPageHeader
        title="My profile"
        description="Your contact details, linked children and notification preferences."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 shrink-0">
                <AvatarFallback className={cn("text-lg font-extrabold", avatarTone(user.avatarSeed))}>
                  {initials(...user.name.replace(/^(Mrs|Mr|Miss|Dr)\.?\s/, "").split(" "))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="truncate font-heading text-lg font-extrabold">{user.name}</h2>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="font-bold">{ROLE_LABELS[role]}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ["Phone", parent?.phone ?? "—"],
                ["Relationship", parent?.relationship ?? "—"],
                ["Occupation", parent?.occupation ?? "—"],
                ["Address", parent?.address ?? "—"],
                ["Emergency contact", parent?.emergencyContactName ?? "—"],
                ["Emergency phone", parent?.emergencyContactPhone ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold break-words">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 rounded-xl bg-muted/70 p-4 text-xs leading-relaxed text-muted-foreground">
              To change your contact details, message the school office. We verify changes to phone
              numbers and addresses before applying them, because they are used for child release and
              emergency contact.
            </p>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Notification preferences</h2>
            <Separator className="my-4" />
            <ul className="space-y-4">
              {PREFERENCES.map((preference) => (
                <li key={preference.key} className="flex items-start justify-between gap-4">
                  <label htmlFor={preference.key} className="min-w-0 cursor-pointer">
                    <span className="block text-sm font-bold">{preference.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{preference.detail}</span>
                  </label>
                  <Switch id={preference.key} defaultChecked={preference.on} />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Linked children</h2>
            <Separator className="my-4" />
            <ul className="space-y-3">
              {myChildren.map((child) => (
                <li key={child.id} className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className={cn("text-xs font-bold", avatarTone(child.avatarSeed))}>
                      {initials(child.firstName, child.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{studentName(child)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {classDisplayName(child.classId)} · {child.studentNo}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
              <ShieldCheckIcon className="size-4 text-gold" />
              Security
            </h2>
            <Separator className="my-4" />
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>· Your session expires automatically after eight hours of inactivity.</li>
              <li>· Your role is read from the school database on every request — never from your browser.</li>
              <li>· You can only ever see records belonging to your own children.</li>
              <li>· Sign out on shared devices using the menu in the top right.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
