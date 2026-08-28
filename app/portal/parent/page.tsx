import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  MessagesSquareIcon,
} from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import { DAY_NAMES } from "@/lib/school/config";
import {
  childrenForSession,
  classDisplayName,
  getActiveTerm,
  getAttendanceForStudent,
  getClass,
  getInvoicesForStudent,
  getNotifications,
  getStudentAssignments,
  getSubject,
  getThreadsForUser,
  getTodaySlots,
  getUpcomingEvents,
  resolveActiveChild,
  studentName,
  summariseAttendance,
  teacherNameById,
} from "@/lib/school/data";
import {
  SUBMISSION_STATUS,
  avatarTone,
  formatDate,
  initials,
  money,
  relativeTime,
} from "@/lib/school/format";
import { DEMO_TODAY } from "@/lib/school/seed";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function ParentDashboard({ searchParams }: PageProps<"/portal/parent">) {
  const user = await requireParent();
  const params = await searchParams;
  const requested = typeof params.child === "string" ? params.child : undefined;

  const myChildren = childrenForSession(user);
  const child = resolveActiveChild(user, requested);

  if (!child) {
    return (
      <EmptyState
        icon="Users"
        title="No children are linked to your account yet"
        description="If your child has just been admitted, their record is created during enrolment. Contact the school office if this looks wrong."
        action={
          <Button size="lg" className="font-bold" render={<Link href="/contact" />}>
            Contact the school
          </Button>
        }
      />
    );
  }

  const assignments = getStudentAssignments(child.id);
  const pending = assignments.filter((a) =>
    ["not_started", "in_progress", "resubmission_required"].includes(a.submission?.status ?? "not_started"),
  );
  const recentlyGraded = assignments
    .filter((a) => a.submission?.status === "graded")
    .sort((a, b) => (b.submission?.gradedAt ?? "").localeCompare(a.submission?.gradedAt ?? ""))
    .slice(0, 4);

  const attendance = summariseAttendance(getAttendanceForStudent(child.id));
  const invoices = getInvoicesForStudent(child.id);
  const outstanding = invoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const todaySlots = getTodaySlots(child.classId).filter((s) => s.subjectId);
  const events = getUpcomingEvents().slice(0, 3);
  const notifications = getNotifications(user.id).slice(0, 5);
  const threads = getThreadsForUser(user.id).slice(0, 3);
  const term = getActiveTerm();

  const weekday = DEMO_TODAY.getUTCDay();
  const dayLabel = DAY_NAMES[weekday === 0 || weekday === 6 ? 1 : weekday];

  return (
    <>
      <PortalPageHeader
        eyebrow={`${term.name} · ${formatDate(DEMO_TODAY)}`}
        title={`Good morning, ${user.name.replace(/^(Mrs|Mr|Miss|Dr)\.?\s/, "").split(" ")[0]}`}
        description={`Here is how ${child.firstName} is doing at school today.`}
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: classDisplayName(c.classId),
              avatarSeed: c.avatarSeed,
            }))}
          />
        }
      />

      {/* Child summary */}
      <Card className="mb-6 gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-5 bg-navy p-5 text-navy-foreground sm:flex-row sm:items-center sm:p-6">
          <Avatar className="size-16 shrink-0 ring-2 ring-gold/40">
            <AvatarFallback className={cn("text-lg font-extrabold", avatarTone(child.avatarSeed))}>
              {initials(child.firstName, child.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-xl font-extrabold">{studentName(child)}</h2>
            <p className="mt-1 text-sm text-navy-foreground/70">
              {classDisplayName(child.classId)} · {child.studentNo} · {child.house} House
            </p>
            <p className="mt-1 text-sm text-navy-foreground/70">
              Class teacher: {teacherNameById(getClass(child.classId)?.classTeacherId)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              className="h-11 bg-gold font-bold text-gold-foreground hover:bg-gold/85"
              render={<Link href={`/portal/parent/children/${child.id}`} />}
            >
              Full profile
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </Card>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending work"
          value={pending.length}
          hint={pending.length === 0 ? "All caught up" : "Assignments still to submit"}
          icon="ClipboardList"
          tone={pending.length > 2 ? "warning" : "success"}
          href={`/portal/parent/assignments?child=${child.id}`}
        />
        <StatCard
          label="Attendance"
          value={`${attendance.rate}%`}
          hint={`${attendance.present} present · ${attendance.absent} absent · ${attendance.late} late`}
          icon="CalendarCheck"
          tone={attendance.rate >= 95 ? "success" : attendance.rate >= 90 ? "warning" : "danger"}
          href={`/portal/parent/attendance?child=${child.id}`}
        />
        <StatCard
          label="Outstanding fees"
          value={money(outstanding)}
          hint={outstanding === 0 ? "Fully paid — thank you" : `${term.name} invoice`}
          icon="Receipt"
          tone={outstanding === 0 ? "success" : "warning"}
          href={`/portal/parent/fees?child=${child.id}`}
        />
        <StatCard
          label="Unread messages"
          value={threads.filter((t) => t.messages.some((m) => !m.readBy.includes(user.id))).length}
          hint="From teachers and the school office"
          icon="MessagesSquare"
          tone="info"
          href="/portal/parent/messages"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Today's timetable */}
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">{dayLabel}&apos;s timetable</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href={`/portal/parent/timetable?child=${child.id}`} />}>
                Full week <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {todaySlots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No lessons are scheduled for today.
              </p>
            ) : (
              <ol className="space-y-2">
                {todaySlots.slice(0, 6).map((slot) => (
                  <li key={slot.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                    <span className="w-24 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                      {slot.startTime}–{slot.endTime}
                    </span>
                    <span className="min-w-0 flex-1">
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

          {/* Pending assignments */}
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">Work to do</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href={`/portal/parent/assignments?child=${child.id}`} />}>
                All assignments <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {pending.length === 0 ? (
              <div className="py-8 text-center">
                <ClipboardListIcon className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-semibold">You&apos;re all caught up.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {child.firstName} has submitted everything that has been set.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {pending.slice(0, 5).map(({ assignment, submission, subject }) => {
                  const status = SUBMISSION_STATUS[submission?.status ?? "not_started"];
                  const overdue = new Date(assignment.dueDate) < DEMO_TODAY;
                  return (
                    <li key={assignment.id}>
                      <Link href={`/portal/parent/assignments?child=${child.id}`} className="block">
                        <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:border-gold/40">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{assignment.title}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {subject?.name} · due {formatDate(assignment.dueDate)}
                              {overdue ? " · overdue" : ""}
                            </p>
                          </div>
                          <StatusPill tone={overdue ? "danger" : status.tone}>{status.label}</StatusPill>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Recent results */}
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">Recently graded</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href={`/portal/parent/results?child=${child.id}`} />}>
                Results <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {recentlyGraded.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing has been graded yet this term.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentlyGraded.map(({ assignment, submission, subject }) => {
                  const pct = submission?.score
                    ? Math.round((submission.score / assignment.maxScore) * 100)
                    : 0;
                  return (
                    <li key={assignment.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{assignment.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{subject?.name}</p>
                        </div>
                        <Badge className="shrink-0 font-bold">
                          {submission?.score}/{assignment.maxScore}
                        </Badge>
                      </div>
                      <Progress value={pct} className="mt-3" />
                      {submission?.feedback ? (
                        <p className="mt-3 rounded-lg bg-muted/70 p-3 text-xs leading-relaxed">
                          <span className="font-bold">Teacher feedback · </span>
                          {submission.feedback}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">Notifications</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/parent/notifications" />}>
                All <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <BellIcon className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  You&apos;re up to date. New notifications will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href ?? "/portal/parent"} className="block">
                      <div
                        className={cn(
                          "rounded-xl border p-3.5 transition-colors hover:border-gold/40",
                          n.read ? "bg-card" : "border-gold/40 bg-gold/8",
                        )}
                      >
                        <p className="text-sm font-bold">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                          {relativeTime(n.createdAt, DEMO_TODAY)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Messages */}
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">Messages</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/parent/messages" />}>
                Inbox <ArrowRightIcon />
              </Button>
            </div>
            <Separator className="my-4" />
            {threads.length === 0 ? (
              <div className="py-8 text-center">
                <MessagesSquareIcon className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No messages yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {threads.map((thread) => {
                  const last = thread.messages[thread.messages.length - 1];
                  return (
                    <li key={thread.id}>
                      <Link href={`/portal/parent/messages/${thread.id}`} className="block">
                        <div className="rounded-xl border bg-card p-3.5 transition-colors hover:border-gold/40">
                          <p className="truncate text-sm font-bold">{thread.subject}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{last?.body}</p>
                          <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                            {relativeTime(thread.updatedAt, DEMO_TODAY)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Events */}
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">Upcoming events</h2>
              <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/parent/calendar" />}>
                Calendar <ArrowRightIcon />
              </Button>
            </div>
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
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{event.venue}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="lg" className="mt-4 w-full font-bold" render={<Link href="/portal/parent/appointments" />}>
              <CalendarDaysIcon />
              Book a parent-teacher meeting
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
