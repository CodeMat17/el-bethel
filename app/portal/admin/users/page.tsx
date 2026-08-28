import type { Metadata } from "next";
import { ShieldCheckIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { ROLE_LABELS } from "@/lib/school/config";
import { paginate } from "@/lib/school/data";
import { avatarTone, formatDate, initials } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/school/types";

export const metadata: Metadata = { title: "Users & roles" };

const PERMISSIONS: { role: Role; can: string[]; cannot: string[] }[] = [
  {
    role: "teacher",
    can: ["View assigned pupils", "Create and grade assignments", "Upload materials", "Take attendance", "Enter authorised scores"],
    cannot: ["Change school fees", "Delete pupils", "Manage system settings", "View unrelated financial records"],
  },
  {
    role: "parent",
    can: ["View own children", "View assignments and results", "View attendance", "Pay fees", "Message authorised staff"],
    cannot: ["View another child's data", "View another family's fees", "Modify academic results"],
  },
  {
    role: "pupil",
    can: ["View own learning content", "Submit assignments", "View own results and attendance", "Access class materials"],
    cannot: ["View another pupil's private data", "Modify results", "Access administration functions"],
  },
  {
    role: "accountant",
    can: ["View and reconcile invoices", "Verify payments", "Generate financial reports"],
    cannot: ["View academic records in detail", "Change results", "Manage user roles"],
  },
];

export default async function AdminUsersPage({ searchParams }: PageProps<"/portal/admin/users">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const role = typeof params.role === "string" ? params.role : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const filtered = db.users
    .filter((user) => {
      if (role !== "all" && !user.roles.includes(role as Role)) return false;
      if (!q) return true;
      return `${user.name} ${user.email}`.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const result = paginate(filtered, page, 12);
  const staffAccounts = db.users.filter((u) =>
    u.roles.some((r) => ["admin", "super_admin", "headteacher", "teacher", "accountant", "admissions_officer", "librarian"].includes(r)),
  ).length;

  return (
    <>
      <PortalPageHeader
        title="Users & roles"
        description="Every account on the platform and the role that determines what it can reach."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Accounts" value={db.users.length} icon="ShieldCheck" tone="info" />
        <StatCard label="Staff accounts" value={staffAccounts} icon="GraduationCap" tone="gold" />
        <StatCard label="Parent accounts" value={db.users.filter((u) => u.roles.includes("parent")).length} icon="Users" tone="neutral" />
        <StatCard label="Pupil accounts" value={db.users.filter((u) => u.roles.includes("pupil")).length} icon="Backpack" tone="neutral" />
      </div>

      <Card className="mb-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="flex items-start gap-3 text-sm leading-relaxed">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            Roles are read from the database on every request. A signed cookie identifies the user; it
            never carries their permissions, so a role can never be granted by editing a browser value.
          </span>
        </p>
      </Card>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name or email"
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
        <EmptyState
          className="mt-6"
          icon="Search"
          title="No accounts match your filters"
          description="Try a different name, email or role."
        />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(user.avatarSeed))}>
                            {initials(...user.name.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold">{user.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="font-bold">{ROLE_LABELS[r]}</Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusPill tone={user.active ? "success" : "neutral"}>
                        {user.active ? "Active" : "Disabled"}
                      </StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
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
        <p className="mt-1 text-sm text-muted-foreground">
          What each role can and cannot do. Enforced on the server, on every request.
        </p>
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
