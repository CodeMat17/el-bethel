import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, UnlinkIcon } from "lucide-react";

import { LinkChildDialog } from "@/components/admin/link-dialogs";
import { ParentDialog, StudentDialog } from "@/components/admin/people-dialogs";
import { SignInCard } from "@/components/admin/sign-in-card";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ProfilePhoto } from "@/components/portal/profile-photo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { linkGuardian } from "@/lib/school/actions/admin";
import { isSuperAdmin, requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { initials } from "@/lib/school/format";

export const metadata: Metadata = { title: "Parent" };

export default async function AdminParentPage({ params }: PageProps<"/portal/admin/parents/[id]">) {
  const viewer = await requireAdmin();
  const { id } = await params;
  const [data, dir] = await Promise.all([query(api.people.getParentDetail, { id }), getDirectory()]);
  if (!data) notFound();
  const { parent, children, account } = data;
  const name = `${parent.title} ${parent.firstName} ${parent.lastName}`;
  const classNames = Object.fromEntries(dir.classes.map((c) => [c.id, c.name]));

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/admin/parents" />}>
        <ArrowLeftIcon />
        All parents
      </Button>

      <PortalPageHeader eyebrow={parent.relationship} title={name} description={`${parent.phone}${parent.email ? ` · ${parent.email}` : ""}`} action={<ParentDialog parent={parent} />} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Details</h2>
            <Separator className="my-4" />
            <div className="mb-5 flex justify-center sm:justify-start">
              <ProfilePhoto url={parent.photo?.url} seed={parent.avatarSeed} initials={initials(parent.firstName, parent.lastName)} />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Occupation", parent.occupation || "—"],
                ["Emergency contact", parent.emergencyContactName ? `${parent.emergencyContactName} · ${parent.emergencyContactPhone}` : "—"],
                ["Address", parent.address || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                  <dd className="mt-0.5 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <SignInCard kind="parent" name={name} email={parent.email} profileId={parent.id} account={account} canGrantAdmin={isSuperAdmin(viewer)} />
        </div>

        <Card className="gap-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-base font-extrabold">Children</h2>
            <div className="flex flex-wrap gap-2">
              <LinkChildDialog parentId={parent.id} linkedStudentIds={children.map((c) => c.id)} classNames={classNames} />
              <StudentDialog
                classes={dir.classes.map((c) => ({ value: c.id, label: c.name }))}
                parentId={parent.id}
                trigger={
                  <Button size="sm" variant="outline" className="font-bold">
                    <PlusIcon />
                    Enrol a child
                  </Button>
                }
              />
            </div>
          </div>
          <Separator className="my-4" />
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No children linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {children.map((child) => (
                <li key={child.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/portal/admin/students/${child.id}`} className="block truncate text-sm font-bold hover:underline">
                      {studentName(child)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {dir.className(child.classId)} · {child.studentNo}
                    </p>
                  </div>
                  <ConfirmAction
                    action={linkGuardian.bind(null, child.id, parent.id, false)}
                    icon={<UnlinkIcon />}
                    variant="ghost"
                    pendingText="Unlinking…"
                    confirm={{ title: `Unlink ${child.firstName}?`, description: "This parent will no longer see this child in the parent portal.", confirmLabel: "Unlink" }}
                  >
                    Unlink
                  </ConfirmAction>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
