import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, PenSquareIcon, PlusIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { DAY_NAMES } from "@/lib/school/config";
import { query } from "@/lib/school/convex";
import { schoolDay, slotsForDay, studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate, relativeTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function TeacherDashboard() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return (
      <EmptyState
        icon="GraduationCap"
        title="No teaching record linked"
        description="Your account does not have a teacher record. Contact the school administrator."
      />
    );
  }

  const [mine, pendingGrading, timetable, notifications, inbox, events, sizes, dir] = await Promise.all([
    query(api.assignments.forTeacher, {}),
    query(api.assignments.pendingForTeacher, {}),
    query(api.timetable.forTeacher, {}),
    query(api.notifications.mine, { limit: 4 }),
    query(api.messages.myThreads, {}),
    query(api.content.events, { upcomingOnly: true, limit: 3 }),
    query(api.people.classSizes, {}),
    getDirectory(),
  ]);
  const classes = dir.classesForTeacher(user.teacherId);
  const assignments = mine.map((m) => m.assignment);
  const todaySlots = slotsForDay(timetable);
  const threads = inbox.threads.slice(0, 3);
  const term = dir.activeTerm;
  const pupilCount = classes.reduce((sum, c) => sum + (sizes[c.id] ?? 0), 0);
  const now = new Date();
  const dayLabel = DAY_NAMES[schoolDay(now)];

  return (
    <>
      <PortalPageHeader
        eyebrow={`${term?.name ?? "Current term"} · ${formatDate(now)}`}
        title={`Good morning, ${user.name.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" ")[0]}`}
        description="Your classes, your marking queue and today's teaching schedule."
        action={
          <Button size="lg" className="font-bold" render={<Link href="/portal/teacher/assignments/create" />}>
            <PlusIcon />
            New assignment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My classes" value={classes.length} hint={`${pupilCount} pupils`} icon="School" tone="info" href="/portal/teacher/classes" />
        <StatCard label="Lessons today" value={todaySlots.filter((s) => s.subjectId).length} hint={dayLabel} icon="Clock" tone="neutral" href="/portal/teacher/timetable" />
        <StatCard
          label="Awaiting grading"
          value={pendingGrading.length}
          hint={pendingGrading.length === 0 ? "Nothing in the queue" : "Submissions to mark"}
          icon="PenSquare"
          tone={pendingGrading.length > 10 ? "danger" : pendingGrading.length > 0 ? "warning" : "success"}
          href="/portal/teacher/grading"
        />
        <StatCard label="Published assignments" value={assignments.filter((a) => a.status === "published").length} icon="ClipboardList" tone="gold" href="/portal/teacher/assignments" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">{dayLabel}&apos;s teaching</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/teacher/timetable" />}>
                Full week <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {todaySlots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You have no timetabled lessons today.
              </p>
            ) : (
              <ol className="space-y-2">
                {todaySlots.map((slot) => (
                  <li key={slot.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                    <span className="w-24 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                      {slot.startTime}–{slot.endTime}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {dir.subjectName(slot.subjectId)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {dir.className(slot.classId)}
                      </span>
                    </span>
                    <Button variant="outline" size="sm" className="shrink-0 font-bold" render={<Link href={`/portal/teacher/classes/${slot.classId}`} />}>
                      Open class
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">Marking queue</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/teacher/grading" />}>
                Open grading <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {pendingGrading.length === 0 ? (
              <div className="py-8 text-center">
                <PenSquareIcon className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-semibold">Nothing to mark.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every submission has been marked.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {pendingGrading.slice(0, 6).map(({ submission, assignment, student }) => {
                  return (
                    <li key={submission.id}>
                      <Link href={`/portal/teacher/assignments/${assignment.id}`} className="block">
                        <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:border-gold/40">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{studentName(student)}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {assignment.title} · {dir.className(assignment.classId)}
                            </p>
                          </div>
                          <StatusPill tone="info">Awaiting marking</StatusPill>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">Recent assignments</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/teacher/assignments" />}>
                All <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            <ul className="space-y-3">
              {mine.slice(0, 4).map(({ assignment, stats }) => {
                const pct = stats.students ? Math.round((stats.submitted / stats.students) * 100) : 0;
                return (
                  <li key={assignment.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold">{assignment.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {dir.className(assignment.classId)} · {dir.subjectName(assignment.subjectId)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-muted-foreground">
                        {stats.submitted}/{stats.students}
                      </span>
                    </div>
                    <Progress value={pct} className="mt-3" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {stats.graded} marked · {stats.pendingGrading} awaiting · {stats.notSubmitted} not submitted
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Quick actions</h2>
            <Separator className="my-4" />
            <div className="grid gap-2">
              {[
                { label: "Take the register", href: "/portal/teacher/attendance", icon: "CalendarCheck" },
                { label: "Create an assignment", href: "/portal/teacher/assignments/create", icon: "PlusIcon" },
                { label: "Enter results", href: "/portal/teacher/results", icon: "Trophy" },
                { label: "Upload material", href: "/portal/teacher/materials", icon: "FolderOpen" },
              ].map((item) => (
                <Button
                  key={item.href}
                  variant="outline"
                  size="lg"
                  className="justify-start font-bold"
                  render={<Link href={item.href} />}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">My classes</h2>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {classes.slice(0, 6).map((cls) => (
                <li key={cls.id}>
                  <Link href={`/portal/teacher/classes/${cls.id}`} className="block">
                    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-gold/40">
                      <span className="truncate text-sm font-bold">{cls.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {sizes[cls.id] ?? 0} pupils
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Notifications</h2>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className={`rounded-xl border p-3.5 ${n.read ? "bg-card" : "border-gold/40 bg-gold/8"}`}>
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                    {relativeTime(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Messages & events</h2>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link href={`/portal/teacher/messages/${thread.id}`} className="block">
                    <div className="rounded-xl border bg-card p-3 transition-colors hover:border-gold/40">
                      <p className="truncate text-sm font-bold">{thread.subject}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {relativeTime(thread.updatedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {events.map((event) => (
                <li key={event.id} className="rounded-xl border bg-card p-3">
                  <p className="truncate text-sm font-bold">{event.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(event.date)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
