import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { classDisplayName, getStudent, paginate, studentName } from "@/lib/school/data";
import { avatarTone, initials } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Parents" };

export default async function AdminParentsPage({ searchParams }: PageProps<"/portal/admin/parents">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const relationship = typeof params.relationship === "string" ? params.relationship : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const filtered = db.parents
    .filter((parent) => {
      if (relationship !== "all" && parent.relationship !== relationship) return false;
      if (!q) return true;
      return (
        `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(q) ||
        parent.email.toLowerCase().includes(q) ||
        parent.phone.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const result = paginate(filtered, page, 12);
  const multiChild = db.parents.filter((p) => p.studentIds.length > 1).length;

  return (
    <>
      <PortalPageHeader
        title="Parents & guardians"
        description="Every registered family, their contact details and the children linked to them."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered parents" value={db.parents.length} icon="Users" tone="info" />
        <StatCard label="With more than one child" value={multiChild} icon="UserPlus" tone="gold" />
        <StatCard label="Matching filter" value={result.total} icon="Search" tone="neutral" />
        <StatCard label="Pupils linked" value={db.students.length} icon="Backpack" tone="neutral" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, email or phone"
          filters={[
            {
              key: "relationship",
              label: "Relationships",
              options: [
                { value: "Mother", label: "Mother" },
                { value: "Father", label: "Father" },
                { value: "Guardian", label: "Guardian" },
              ],
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="Search"
          title="No parents match your search"
          description="Try a different name, email or phone number."
        />
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {result.items.map((parent) => (
              <li key={parent.id}>
                <Card className="gap-0 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 shrink-0">
                      <AvatarFallback className={cn("text-xs font-bold", avatarTone(parent.avatarSeed))}>
                        {initials(parent.firstName, parent.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">
                        {parent.title} {parent.firstName} {parent.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{parent.phone}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-bold">
                      {parent.studentIds.length}
                    </Badge>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto rounded-2xl border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent / guardian</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Occupation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((parent) => (
                  <TableRow key={parent.id}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(parent.avatarSeed))}>
                            {initials(parent.firstName, parent.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold">
                          {parent.title} {parent.firstName} {parent.lastName}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{parent.relationship}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{parent.phone}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">{parent.email}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {parent.studentIds.map((sid) => {
                          const child = getStudent(sid);
                          return child ? (
                            <Badge key={sid} variant="secondary" className="font-bold">
                              {studentName(child)} · {classDisplayName(child.classId)}
                            </Badge>
                          ) : null;
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{parent.occupation}</TableCell>
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
            basePath="/portal/admin/parents"
            params={{ q, relationship }}
          />
        </>
      )}
    </>
  );
}
