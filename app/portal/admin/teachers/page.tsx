import Link from "next/link";
import type { Metadata } from "next";

import { TeacherDialog } from "@/components/admin/people-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { pageParam, param, teacherName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { avatarTone, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Teachers" };

export default async function AdminTeachersPage({ searchParams }: PageProps<"/portal/admin/teachers">) {
  await requireAdmin();
  const params = await searchParams;
  const q = param(params.q);
  const department = param(params.department, "all");
  const page = pageParam(params.page);
  const [result, dir] = await Promise.all([
    query(api.people.listTeachers, { search: q, department, page, pageSize: 12 }),
    getDirectory(),
  ]);

  return (
    <>
      <PortalPageHeader
        title="Teachers & staff"
        description="Staff records. Assign classes and subjects on the Classes page; open a teacher to create their sign-in."
        action={<TeacherDialog departments={result.departments} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active staff" value={result.counts.active} icon="GraduationCap" tone="info" />
        <StatCard label="On record" value={result.counts.all} icon="Users" tone="neutral" />
        <StatCard label="Class teachers" value={dir.teachers.filter((t) => t.isClassTeacher).length} icon="School" tone="gold" />
        <StatCard label="Departments" value={result.departments.length} icon="Layers" tone="neutral" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, staff number, position or email"
          filters={[{ key: "department", label: "Departments", options: result.departments.map((d) => ({ value: d, label: d })) }]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState className="mt-6" icon="Search" title="No staff match your search" description="Try a different name or department." />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Teaches</TableHead>
                  <TableHead>Sign-in</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/portal/admin/teachers/${t.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="size-9 shrink-0">
                          {t.photo ? <AvatarImage src={t.photo.url} alt="" /> : null}
                          <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(t.avatarSeed))}>
                            {initials(t.firstName, t.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <span className="block font-bold">{teacherName(t)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {t.position} · {t.staffNo}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.department}</TableCell>
                    <TableCell>
                      <span className="flex max-w-80 flex-wrap gap-1">
                        {t.classIds.slice(0, 4).map((cid) => (
                          <Badge key={cid} variant="secondary" className="font-bold">
                            {dir.className(cid)}
                          </Badge>
                        ))}
                        {t.classIds.length > 4 ? <Badge variant="outline">+{t.classIds.length - 4}</Badge> : null}
                        {t.classIds.length === 0 ? <span className="text-xs text-muted-foreground">No classes</span> : null}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!t.active ? (
                        <StatusPill tone="neutral">Left</StatusPill>
                      ) : t.account?.hasLogin ? (
                        <span className="font-mono text-xs">@{t.account.username}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="font-bold" render={<Link href={`/portal/admin/teachers/${t.id}`} />}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} basePath="/portal/admin/teachers" params={{ q, department }} />
        </>
      )}
    </>
  );
}
