import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { EmptyState, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import {
  childrenForSession,
  classDisplayName,
  getAttendanceForStudent,
  getClass,
  getInvoicesForStudent,
  getStudentAssignments,
  studentName,
  summariseAttendance,
  teacherNameById,
} from "@/lib/school/data";
import { avatarTone, initials, money } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Children" };

export default async function ParentChildrenPage() {
  const user = await requireParent();
  const myChildren = childrenForSession(user);

  if (myChildren.length === 0) {
    return (
      <EmptyState
        icon="Users"
        title="No children are linked to your account"
        description="Contact the school office if you believe this is a mistake."
      />
    );
  }

  return (
    <>
      <PortalPageHeader
        title="My children"
        description={`${myChildren.length} ${myChildren.length === 1 ? "child" : "children"} enrolled at El-Bethel International Academy.`}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {myChildren.map((child) => {
          const attendance = summariseAttendance(getAttendanceForStudent(child.id));
          const assignments = getStudentAssignments(child.id);
          const pending = assignments.filter((a) =>
            ["not_started", "in_progress", "resubmission_required"].includes(
              a.submission?.status ?? "not_started",
            ),
          ).length;
          const balance = getInvoicesForStudent(child.id).reduce(
            (sum, i) => sum + (i.total - i.amountPaid),
            0,
          );

          return (
            <Card key={child.id} className="gap-0 overflow-hidden p-0">
              <div className="flex items-center gap-4 bg-navy p-5 text-navy-foreground">
                <Avatar className="size-14 shrink-0 ring-2 ring-gold/40">
                  <AvatarFallback className={cn("font-extrabold", avatarTone(child.avatarSeed))}>
                    {initials(child.firstName, child.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-lg font-extrabold">{studentName(child)}</h2>
                  <p className="mt-0.5 truncate text-sm text-navy-foreground/70">
                    {classDisplayName(child.classId)} · {child.studentNo}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <dl className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border bg-card p-3">
                    <dt className="text-[0.65rem] font-bold text-muted-foreground uppercase">Attendance</dt>
                    <dd className="mt-1 font-heading text-lg font-extrabold">{attendance.rate}%</dd>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <dt className="text-[0.65rem] font-bold text-muted-foreground uppercase">To do</dt>
                    <dd className="mt-1 font-heading text-lg font-extrabold">{pending}</dd>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <dt className="text-[0.65rem] font-bold text-muted-foreground uppercase">Balance</dt>
                    <dd className="mt-1 font-heading text-sm font-extrabold">{money(balance)}</dd>
                  </div>
                </dl>

                <Progress value={attendance.rate} className="mt-4" />

                <Separator className="my-5" />

                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Class teacher</dt>
                    <dd className="truncate font-bold">
                      {teacherNameById(getClass(child.classId)?.classTeacherId)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">House</dt>
                    <dd className="font-bold">{child.house}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <StatusPill tone={child.status === "active" ? "success" : "neutral"}>
                        {child.status}
                      </StatusPill>
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1 font-bold"
                    render={<Link href={`/portal/parent/children/${child.id}`} />}
                  >
                    Full profile
                    <ArrowRightIcon />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 font-bold"
                    render={<Link href={`/portal/parent?child=${child.id}`} />}
                  >
                    Open dashboard
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
