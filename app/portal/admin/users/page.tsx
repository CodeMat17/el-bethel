import type { Metadata } from "next";
import { BanIcon, CircleCheckIcon, ShieldCheckIcon } from "lucide-react";

import { CreateLoginDialog, ResetPasswordDialog, RolesDialog } from "@/components/admin/account-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { setAccountActive } from "@/lib/school/actions/admin";
import { isSuperAdmin, requireAdmin } from "@/lib/school/auth";
import { ROLE_LABELS } from "@/lib/school/config";
import { query } from "@/lib/school/convex";
import { pageParam, param } from "@/lib/school/data";
import { avatarTone, formatDate, initials } from "@/lib/school/format";
import type { Role } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Users & roles" };

const PERMISSIONS: { role: Role; can: string[]; cannot: string[] }[] = [
  {
    role: "super_admin",
    can: ["Everything an administrator can do", "Create and remove administrator accounts", "Change any account's roles"],
    cannot: ["Remove their own super administrator role", "Disable their own account"],
  },
  {
    role: "admin",
    can: ["Create sign-ins for pupils, parents and teachers", "Manage classes, subjects, terms and teachers", "Edit website content", "See every assignment and result"],
    cannot: ["Create or change administrator accounts"],
  },
  {
    role: "teacher",
    can: ["Set assignments for classes they teach", "Mark submissions", "Enter scores for their subjects", "Publish results as class teacher"],
    cannot: ["See classes they don't teach", "Change published results", "Manage accounts"],
  },
  {
    role: "parent",
    can: ["View their own children's work, scores and results", "Message their children's teachers", "Book parent-teacher meetings"],
    cannot: ["View another family's records", "Modify academic results"],
  },
  {
    role: "pupil",
    can: ["See and answer their assignments once", "See scores as soon as work is marked", "See published exam results"],
    cannot: ["Submit after the due date or twice", "View another pupil's records"],
  },
];

export default async function AdminUsersPage({ searchParams }: PageProps<"/portal/admin/users">) {
  const viewer = await requireAdmin();
  const params = await searchParams;
  const q = param(params.q).trim();
  const role = param(params.role, "all");
  const page = pageParam(params.page);

  const result = await query(api.users.list, { search: q, role, page, pageSize: 12 });
  const superAdmin = isSuperAdmin(viewer);

  return (
    <>
      <PortalPageHeader
        title="Users & sign-ins"
        description="Every account on the platform. Accounts are created by the school — public sign-up is turned off."
        action={<CreateLoginDialog kind="staff" canGrantAdmin={superAdmin} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Accounts" value={result.counts.all} icon="ShieldCheck" tone="info" />
        <StatCard label="Staff" value={result.counts.staff} icon="GraduationCap" tone="gold" />
        <StatCard label="Parents · Pupils" value={`${result.counts.parents} · ${result.counts.pupils}`} icon="Users" tone="neutral" />
        <StatCard label="Without a sign-in" value={result.counts.withoutLogin} icon="KeyRound" tone={result.counts.withoutLogin ? "warning" : "success"} />
      </div>

      <Card className="mb-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="flex items-start gap-3 text-sm leading-relaxed">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            Clerk handles signing in; roles live in Convex and are checked on every request. To give a pupil, parent or
            teacher a sign-in, open their record (Pupils, Parents or Teachers) and choose <b>Create sign-in</b>.
          </span>
        </p>
      </Card>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, username or email"
          filters={[
            {
              key: "role",
              label: "Roles",
              options: (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState className="mt-6" icon="Search" title="No accounts match your filters" description="Try a different name, email or role." />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Sign-in</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((user) => {
                  const privileged = user.roles.includes("admin") || user.roles.includes("super_admin");
                  const canManage = superAdmin || !privileged;
                  const self = user.id === viewer.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(user.avatarSeed))}>
                              {initials(...user.name.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block truncate font-bold">{user.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {user.username ? `@${user.username}` : "—"}
                              {user.email ? ` · ${user.email}` : ""}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="font-bold">
                              {ROLE_LABELS[r]}
                            </Badge>
                          ))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!user.active ? (
                          <StatusPill tone="danger">Disabled</StatusPill>
                        ) : user.clerkUserId ? (
                          <StatusPill tone="success">Can sign in</StatusPill>
                        ) : (
                          <StatusPill tone="warning">No sign-in yet</StatusPill>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <div className="flex flex-wrap justify-end gap-1">
                            {!user.clerkUserId ? (
                              <CreateLoginDialog
                                kind={user.studentId ? "pupil" : user.parentId ? "parent" : user.teacherId ? "teacher" : "staff"}
                                name={user.name}
                                email={user.email}
                                userId={user.id}
                                profileId={user.studentId ?? user.parentId ?? user.teacherId}
                                canGrantAdmin={superAdmin}
                              />
                            ) : (
                              <ResetPasswordDialog userId={user.id} name={user.name} />
                            )}
                            <RolesDialog
                              userId={user.id}
                              name={user.name}
                              roles={user.roles}
                              canGrantAdmin={superAdmin}
                              hasTeacher={Boolean(user.teacherId)}
                              hasParent={Boolean(user.parentId)}
                              hasStudent={Boolean(user.studentId)}
                            />
                            {!self ? (
                              user.active ? (
                                <ConfirmAction
                                  action={setAccountActive.bind(null, user.id, false)}
                                  icon={<BanIcon />}
                                  variant="ghost"
                                  className="font-bold text-destructive"
                                  pendingText="Disabling…"
                                  destructive
                                  confirm={{
                                    title: `Disable ${user.name}?`,
                                    description: "They will be signed out everywhere and can't sign in until you enable the account again.",
                                    confirmLabel: "Disable",
                                  }}
                                >
                                  Disable
                                </ConfirmAction>
                              ) : (
                                <ConfirmAction action={setAccountActive.bind(null, user.id, true)} icon={<CircleCheckIcon />} variant="ghost" className="font-bold" pendingText="Enabling…">
                                  Enable
                                </ConfirmAction>
                              )
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-right text-xs text-muted-foreground">Super administrator only</p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/admin/users"
            params={{ q, role }}
          />
        </>
      )}

      <section className="mt-10">
        <h2 className="font-heading text-lg font-extrabold">Role permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">What each role can and cannot do. Enforced in Convex on every request.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PERMISSIONS.map((entry) => (
            <Card key={entry.role} className="gap-0 p-5">
              <h3 className="font-heading text-base font-extrabold">{ROLE_LABELS[entry.role]}</h3>
              <Separator className="my-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-success uppercase">Can</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    {entry.can.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-destructive uppercase">Cannot</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    {entry.cannot.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
