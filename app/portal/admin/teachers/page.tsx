import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
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
import { getSubject, getTeachers, paginate, teacherName } from "@/lib/school/data";
import { avatarTone, formatDate, initials } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Teachers" };

export default async function AdminTeachersPage({ searchParams }: PageProps<"/portal/admin/teachers">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const department = typeof params.department === "string" ? params.department : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const teachers = getTeachers();
  const departments = Array.from(new Set(teachers.map((t) => t.department))).sort();

  const filtered = teachers
    .filter((teacher) => {
      if (department !== "all" && teacher.department !== department) return false;
      if (!q) return true;
      return (
        `${teacher.firstName} ${teacher.lastName} ${teacher.position} ${teacher.staffNo}`
          .toLowerCase()
          .includes(q)
      );
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const result = paginate(filtered, page, 12);
  const classTeachers = teachers.filter((t) => t.isClassTeacher).length;
  const lessons = getDb().timetable.filter((s) => s.teacherId).length;

  return (
    <>
      <PortalPageHeader
        title="Teachers & staff"
        description="Teaching staff, their departments, subjects, classes and workload."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active teachers" value={teachers.filter((t) => t.active).length} icon="GraduationCap" tone="info" />
        <StatCard label="Class teachers" value={classTeachers} icon="School" tone="gold" />
        <StatCard label="Departments" value={departments.length} icon="Layers" tone="neutral" />
        <StatCard label="Timetabled lessons" value={lessons} icon="Clock" tone="neutral" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, role or staff number"
          filters={[
            {
              key: "department",
              label: "Departments",
              options: departments.map((d) => ({ value: d, label: d })),
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="Search"
          title="No staff match your search"
          description="Try a different name, role or department."
        />
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {result.items.map((teacher) => (
              <li key={teacher.id}>
                <Card className="gap-0 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 shrink-0">
                      <AvatarFallback className={cn("text-xs font-bold", avatarTone(teacher.avatarSeed))}>
                        {initials(teacher.firstName, teacher.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{teacherName(teacher)}</p>
                      <p className="truncate text-xs text-muted-foreground">{teacher.position}</p>
                    </div>
                    <StatusPill tone={teacher.active ? "success" : "neutral"}>
                      {teacher.active ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto rounded-2xl border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Staff number</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(teacher.avatarSeed))}>
                            {initials(teacher.firstName, teacher.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold">{teacherName(teacher)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{teacher.staffNo}</TableCell>
                    <TableCell className="text-muted-foreground">{teacher.position}</TableCell>
                    <TableCell className="text-muted-foreground">{teacher.department}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {teacher.subjectIds.slice(0, 3).map((sid) => (
                          <Badge key={sid} variant="secondary" className="font-bold">
                            {getSubject(sid)?.name}
                          </Badge>
                        ))}
                        {teacher.subjectIds.length > 3 ? (
                          <Badge variant="outline" className="font-bold">
                            +{teacher.subjectIds.length - 3}
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{teacher.classIds.length}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {formatDate(teacher.joinedAt)}
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
            basePath="/portal/admin/teachers"
            params={{ q, department }}
          />
        </>
      )}
    </>
  );
}
