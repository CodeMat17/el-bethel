import Link from "next/link";
import type { Metadata } from "next";

import { StudentDialog } from "@/components/admin/people-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { pageParam, param, studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { avatarTone, formatDate, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pupils" };

export default async function AdminStudentsPage({ searchParams }: PageProps<"/portal/admin/students">) {
  await requireAdmin();
  const params = await searchParams;
  const q = param(params.q);
  const classId = param(params.class, "all");
  const status = param(params.status, "all");
  const page = pageParam(params.page);

  const [result, dir] = await Promise.all([
    query(api.people.listStudents, { search: q, classId, status, page, pageSize: 12 }),
    getDirectory(),
  ]);
  const classOptions = dir.classes.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <PortalPageHeader
        title="Pupils"
        description="Every pupil record. Open a pupil to edit their details, link parents or create their sign-in."
        action={<StudentDialog classes={classOptions} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active pupils" value={result.counts.active} icon="Backpack" tone="info" />
        <StatCard label="Boys · Girls" value={`${result.counts.male} · ${result.counts.female}`} icon="Users" tone="neutral" />
        <StatCard label="Classes" value={dir.classes.length} icon="School" tone="neutral" />
        <StatCard label="Matching filter" value={result.total} icon="Search" tone="gold" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, student number or admission number"
          filters={[
            { key: "class", label: "Classes", options: classOptions },
            {
              key: "status",
              label: "Statuses",
              options: [
                { value: "active", label: "Active" },
                { value: "graduated", label: "Graduated" },
                { value: "transferred", label: "Transferred" },
                { value: "archived", label: "Archived" },
              ],
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState className="mt-6" icon="Search" title="No pupils match your search" description="Try a different name or clear the filters." />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pupil</TableHead>
                  <TableHead>Student number</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Sign-in</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link href={`/portal/admin/students/${student.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="size-8 shrink-0">
                          {student.photo ? <AvatarImage src={student.photo.url} alt="" /> : null}
                          <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(student.avatarSeed))}>
                            {initials(student.firstName, student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold">{studentName(student)}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{student.studentNo}</TableCell>
                    <TableCell>{dir.className(student.classId)}</TableCell>
                    <TableCell>
                      {student.account?.hasLogin ? (
                        <span className="font-mono text-xs">@{student.account.username}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(student.enrolledAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <StatusPill tone={student.status === "active" ? "success" : "neutral"}>{student.status}</StatusPill>
                        <Button size="sm" variant="outline" className="font-bold" render={<Link href={`/portal/admin/students/${student.id}`} />}>
                          Open
                        </Button>
                      </div>
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
            basePath="/portal/admin/students"
            params={{ q, class: classId, status }}
          />
        </>
      )}
    </>
  );
}
