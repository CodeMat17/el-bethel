import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, PartyPopperIcon, StarIcon } from "lucide-react";

import { EmptyState, StatusPill } from "@/components/common";
import { Icon } from "@/components/icon";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import { DAY_NAMES } from "@/lib/school/config";
import {
  classDisplayName,
  getAttendanceForStudent,
  getClass,
  getNotifications,
  getStudent,
  getStudentAssignments,
  getSubject,
  getTodaySlots,
  getUpcomingEvents,
  studentName,
  summariseAttendance,
  teacherNameById,
} from "@/lib/school/data";
import { SUBMISSION_STATUS, formatDate } from "@/lib/school/format";
import { DEMO_TODAY } from "@/lib/school/seed";

export const metadata: Metadata = { title: "My School" };

const TILES = [
  { label: "My Assignments", href: "/portal/pupil/assignments", icon: "ClipboardList", tone: "bg-gold/15 text-gold-foreground dark:text-gold" },
  { label: "My Subjects", href: "/portal/pupil/subjects", icon: "BookOpen", tone: "bg-info/12 text-info" },
  { label: "Learning Materials", href: "/portal/pupil/materials", icon: "FolderOpen", tone: "bg-success/12 text-success" },
  { label: "Quizzes", href: "/portal/pupil/quizzes", icon: "Puzzle", tone: "bg-primary/10 text-primary dark:text-gold" },
  { label: "My Results", href: "/portal/pupil/results", icon: "Trophy", tone: "bg-gold/15 text-gold-foreground dark:text-gold" },
  { label: "My Timetable", href: "/portal/pupil/timetable", icon: "Clock", tone: "bg-info/12 text-info" },
];

export default async function PupilHome() {
  const user = await requirePupil();
  const student = user.studentId ? getStudent(user.studentId) : null;

  if (!student) {
    return <EmptyState icon="Backpack" title="No pupil record found" description="Please contact your class teacher." />;
  }

  const assignments = getStudentAssignments(student.id);
  const todo = assignments.filter((a) =>
    ["not_started", "in_progress", "resubmission_required"].includes(a.submission?.status ?? "not_started"),
  );
  const graded = assignments.filter((a) => a.submission?.status === "graded");
  const attendance = summariseAttendance(getAttendanceForStudent(student.id));
  const slots = getTodaySlots(student.classId).filter((s) => s.subjectId);
  const notifications = getNotifications(user.id).filter((n) => !n.read).slice(0, 3);
  const events = getUpcomingEvents().slice(0, 2);
  const cls = getClass(student.classId);

  const weekday = DEMO_TODAY.getUTCDay();
  const dayLabel = DAY_NAMES[weekday === 0 || weekday === 6 ? 1 : weekday];

  return (
    <>
      <PortalPageHeader
        eyebrow={`${dayLabel} · ${formatDate(DEMO_TODAY)}`}
        title={`Hello, ${student.firstName}!`}
        description={`You are in ${classDisplayName(student.classId)} with ${teacherNameById(cls?.classTeacherId)}.`}
      />

      {/* Big friendly summary */}
      <Card className="mb-6 gap-0 overflow-hidden border-gold/30 p-0">
        <div className="grid gap-4 bg-navy p-6 text-navy-foreground sm:grid-cols-3">
          <div className="text-center">
            <p className="font-heading text-4xl leading-none font-extrabold text-gold">{todo.length}</p>
            <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/70 uppercase">
              Things to do
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-4xl leading-none font-extrabold text-gold">{graded.length}</p>
            <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/70 uppercase">
              Marked
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-4xl leading-none font-extrabold text-gold">{attendance.rate}%</p>
            <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/70 uppercase">
              Attendance
            </p>
          </div>
        </div>
      </Card>

      {/* Big tiles — large touch targets for young pupils */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group block">
            <Card className="flex min-h-32 flex-col items-center justify-center gap-3 p-4 text-center transition-all group-hover:-translate-y-1 group-hover:border-gold/50 group-hover:shadow-lg sm:min-h-40">
              <span className={`grid size-14 place-items-center rounded-2xl sm:size-16 ${tile.tone}`}>
                <Icon name={tile.icon} className="size-6 sm:size-7" />
              </span>
              <span className="text-sm font-extrabold sm:text-base">{tile.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">My work to do</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/pupil/assignments" />}>
                See all <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {todo.length === 0 ? (
              <div className="py-10 text-center">
                <PartyPopperIcon className="mx-auto size-10 text-gold" />
                <p className="mt-4 font-heading text-lg font-extrabold">You&apos;re all caught up!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No assignments have been posted yet. Well done.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {todo.slice(0, 4).map(({ assignment, submission, subject }) => {
                  const status = SUBMISSION_STATUS[submission?.status ?? "not_started"];
                  const overdue = new Date(assignment.dueDate) < DEMO_TODAY;
                  return (
                    <li key={assignment.id}>
                      <Link href={`/portal/pupil/assignments/${assignment.id}`} className="block">
                        <div className="flex min-h-20 items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-gold/50">
                          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-foreground dark:text-gold">
                            <Icon name="ClipboardList" className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-extrabold">{assignment.title}</p>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              {subject?.name} · due {formatDate(assignment.dueDate)}
                            </p>
                          </div>
                          <StatusPill tone={overdue ? "danger" : status.tone}>
                            {overdue ? "Late" : status.label}
                          </StatusPill>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">My lessons today</h2>
            <Separator className="my-4" />
            {slots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No lessons today.</p>
            ) : (
              <ol className="space-y-2">
                {slots.map((slot) => (
                  <li key={slot.id} className="flex min-h-14 items-center gap-4 rounded-xl border bg-card p-3">
                    <span className="w-16 shrink-0 text-sm font-extrabold tabular-nums text-gold-foreground dark:text-gold">
                      {slot.startTime}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        {getSubject(slot.subjectId ?? "")?.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {teacherNameById(slot.teacherId)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">My best marks</h2>
            <Separator className="my-4" />
            {graded.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing has been marked yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {graded
                  .sort((a, b) => (b.submission?.score ?? 0) - (a.submission?.score ?? 0))
                  .slice(0, 3)
                  .map(({ assignment, submission, subject }) => {
                    const pct = Math.round(((submission?.score ?? 0) / assignment.maxScore) * 100);
                    return (
                      <li key={assignment.id} className="rounded-xl border bg-card p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold">{subject?.name}</p>
                          <Badge className="shrink-0 font-bold">
                            {submission?.score}/{assignment.maxScore}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{assignment.title}</p>
                        <Progress value={pct} className="mt-2.5" />
                      </li>
                    );
                  })}
              </ul>
            )}
          </Card>

          {notifications.length > 0 ? (
            <Card className="gap-0 border-gold/30 bg-gold/8 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
                <StarIcon className="size-4 text-gold" />
                New for you
              </h2>
              <Separator className="my-4" />
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <p className="text-sm font-bold">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="lg" className="mt-4 w-full font-bold" render={<Link href="/portal/pupil/notifications" />}>
                See all
              </Button>
            </Card>
          ) : null}

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Coming up at school</h2>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {events.map((event) => (
                <li key={event.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-navy text-navy-foreground">
                    <span className="font-heading text-sm leading-none font-extrabold text-gold">
                      {new Date(event.date).getUTCDate()}
                    </span>
                    <span className="text-[0.55rem] font-bold uppercase">
                      {new Date(event.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                    </span>
                  </div>
                  <p className="min-w-0 truncate text-sm font-bold">{event.title}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {studentName(student)} · {student.studentNo}
      </p>
    </>
  );
}
