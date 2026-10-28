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
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { DAY_NAMES } from "@/lib/school/config";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { schoolDay, slotsForDay, studentName } from "@/lib/school/data";
import { SUBMISSION_STATUS, formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "My School" };

const TILES = [
  { label: "My Assignments", href: "/portal/pupil/assignments", icon: "ClipboardList", tone: "bg-gold/15 text-gold-foreground dark:text-gold" },
  { label: "My Subjects", href: "/portal/pupil/subjects", icon: "BookOpen", tone: "bg-info/12 text-info" },
  { label: "My Profile", href: "/portal/pupil/profile", icon: "UserRound", tone: "bg-primary/10 text-primary dark:text-gold" },
  { label: "My Results", href: "/portal/pupil/results", icon: "Trophy", tone: "bg-gold/15 text-gold-foreground dark:text-gold" },
  { label: "My Timetable", href: "/portal/pupil/timetable", icon: "Clock", tone: "bg-info/12 text-info" },
];

export default async function PupilHome() {
  const user = await requirePupil();
  const student = user.studentId ? await query(api.people.myStudent, {}) : null;

  if (!student) {
    return <EmptyState icon="Backpack" title="No school record found" description="Please contact your class teacher." />;
  }

  const [assignments, timetable, notifications, events, dir] = await Promise.all([
    query(api.assignments.forStudent, { studentId: student.id }),
    query(api.timetable.forClass, { classId: student.classId }),
    query(api.notifications.mine, { unreadOnly: true, limit: 3 }),
    query(api.content.events, { upcomingOnly: true, limit: 2 }),
    getDirectory(),
  ]);
  const todo = assignments.filter((a) => a.progress === "not_started");
  const graded = assignments.filter((a) => a.progress === "graded");
  const slots = slotsForDay(timetable).filter((s) => s.subjectId);
  const cls = dir.getClass(student.classId);
  const now = new Date();
  const dayLabel = DAY_NAMES[schoolDay(now)];
  // JSS students get plainer wording and a denser layout than the younger pupils.
  const secondary = dir.isSecondaryClass(student.classId);
  const words = secondary
    ? { todo: "Pending", graded: "Graded", work: "Pending assignments", lessons: "Today's lessons", marks: "Top scores" }
    : { todo: "Things to do", graded: "Marked", work: "My work to do", lessons: "My lessons today", marks: "My best marks" };

  return (
    <>
      <PortalPageHeader
        eyebrow={`${dayLabel} · ${formatDate(now)}`}
        title={secondary ? `Welcome back, ${student.firstName}` : `Hello, ${student.firstName}!`}
        description={`You are in ${dir.className(student.classId)} with ${dir.teacherName(cls?.classTeacherId)}.`}
      />

      {/* Big friendly summary */}
      <Card className="mb-6 gap-0 overflow-hidden border-gold/30 p-0">
        <div className="grid gap-4 bg-navy p-6 text-navy-foreground sm:grid-cols-3">
          <div className="text-center">
            <p className="font-heading text-4xl leading-none font-extrabold text-gold">{todo.length}</p>
            <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/70 uppercase">
              {words.todo}
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-4xl leading-none font-extrabold text-gold">{graded.length}</p>
            <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/70 uppercase">
              {words.graded}
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-4xl leading-none font-extrabold text-gold">{slots.length}</p>
            <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/70 uppercase">
              Lessons today
            </p>
          </div>
        </div>
      </Card>

      {/* Big tiles — large touch targets for young pupils; a compact row for JSS */}
      <div className={secondary ? "grid grid-cols-3 gap-3 lg:grid-cols-5" : "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group block">
            <Card
              className={
                secondary
                  ? "flex min-h-24 flex-col items-center justify-center gap-2 p-3 text-center transition-all group-hover:border-gold/50 group-hover:shadow-md"
                  : "flex min-h-32 flex-col items-center justify-center gap-3 p-4 text-center transition-all group-hover:-translate-y-1 group-hover:border-gold/50 group-hover:shadow-lg sm:min-h-40"
              }
            >
              <span
                className={`grid place-items-center ${secondary ? "size-10 rounded-xl" : "size-14 rounded-2xl sm:size-16"} ${tile.tone}`}
              >
                <Icon name={tile.icon} className={secondary ? "size-5" : "size-6 sm:size-7"} />
              </span>
              <span className={secondary ? "text-xs font-bold sm:text-sm" : "text-sm font-extrabold sm:text-base"}>
                {secondary ? tile.label.replace(/^My /, "") : tile.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">{words.work}</h2>
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
                  There is nothing to do right now. Well done.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {todo.slice(0, 4).map(({ assignment, progress }) => {
                  const status = SUBMISSION_STATUS[progress];
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
                              {dir.subjectName(assignment.subjectId)} · due {formatDate(assignment.dueDate)}
                            </p>
                          </div>
                          <StatusPill tone={status.tone}>{status.label}</StatusPill>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">{words.lessons}</h2>
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
                        {dir.subjectName(slot.subjectId)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {dir.teacherName(slot.teacherId)}
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
            <h2 className="font-heading text-base font-extrabold">{words.marks}</h2>
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
                  .map(({ assignment, submission }) => {
                    const pct = Math.round(((submission?.score ?? 0) / assignment.maxScore) * 100);
                    return (
                      <li key={assignment.id} className="rounded-xl border bg-card p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold">{dir.subjectName(assignment.subjectId)}</p>
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
