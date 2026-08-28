import type { Metadata } from "next";
import { DownloadIcon, PlusIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import {
  classDisplayName,
  findStudents,
  getAdminMetrics,
  getClasses,
  getParentsOfStudent,
  studentName,
} from "@/lib/school/data";
import { avatarTone, formatDate, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Students" };

export default async function AdminStudentsPage({ searchParams }: PageProps<"/portal/admin/students">) {
  await requireAdmin();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const classId = typeof params.class === "string" ? params.class : "all";
  const status = typeof params.status === "string" ? params.status : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const result = findStudents({ search: q, classId, status, page, pageSize: 12 });
  const metrics = getAdminMetrics();
  const classes = getClasses();

  return (
    <>
      <PortalPageHeader
        title="Students"
        description="Every pupil record, searchable by name, student number or admission number."
        action={
          <>
            <Button variant="outline" size="lg" className="font-bold" disabled>
              <DownloadIcon />
              Export
            </Button>
            <Button size="lg" className="font-bold" disabled>
              <PlusIcon />
              Add pupil
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active pupils" value={metrics.students} icon="Backpack" tone="info" />
        <StatCard label="Classes" value={classes.length} icon="School" tone="neutral" />
        <StatCard label="Matching filter" value={result.total} icon="Search" tone="gold" />
        <StatCard label="Families" value={metrics.parents} icon="Users" tone="neutral" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, student number or admission number"
          filters={[
            {
              key: "class",
              label: "Classes",
              options: classes.map((c) => ({ value: c.id, label: c.name })),
            },
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
        <EmptyState
          className="mt-6"
          icon="Search"
          title="No pupils match your search"
          description="Try a different name or clear the filters."
        />
      ) : (
        <>
          {/* Mobile: cards. Desktop: table. */}
          <ul className="mt-6 space-y-3 lg:hidden">
            {result.items.map((student) => (
              <li key={student.id}>
                <Card className="gap-0 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 shrink-0">
                      <AvatarFallback className={cn("text-xs font-bold", avatarTone(student.avatarSeed))}>
                        {initials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{studentName(student)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {classDisplayName(student.classId)} · {student.studentNo}
                      </p>
                    </div>
                    <StatusPill tone={student.status === "active" ? "success" : "neutral"}>
                      {student.status}
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
                  <TableHead>Pupil</TableHead>
                  <TableHead>Student number</TableHead>
                  <TableHead>Admission number</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent / guardian</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((student) => {
                  const guardians = getParentsOfStudent(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(student.avatarSeed))}>
                              {initials(student.firstName, student.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold">{studentName(student)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{student.studentNo}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{student.admissionNo}</TableCell>
                      <TableCell>{classDisplayName(student.classId)}</TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {guardians[0]
                          ? `${guardians[0].title} ${guardians[0].firstName} ${guardians[0].lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(student.enrolledAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusPill tone={student.status === "active" ? "success" : "neutral"}>
                          {student.status}
                        </StatusPill>
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
            basePath="/portal/admin/students"
            params={{ q, class: classId, status }}
          />
        </>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Adding, editing and exporting pupil records are disabled in this demonstration environment.
        Every such action is written to the audit log in a live deployment.
      </p>
    </>
  );
}
