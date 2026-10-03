import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { BarChart, TrendChart } from "@/components/portal/charts";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { api } from "@/convex/_generated/api";
import type { ToneName } from "@/lib/school/format";
import type { FunctionReturnType } from "convex/server";

export type LearningProfileData = FunctionReturnType<typeof api.insights.forStudent>;

const SIGNAL_TONE: Record<string, ToneName> = { success: "success", info: "info", warning: "warning", danger: "danger" };

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const Icon = value > 0 ? ArrowUpIcon : value < 0 ? ArrowDownIcon : MinusIcon;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground"}`}>
      <Icon className="size-3" />
      {Math.abs(value)}
    </span>
  );
}

/**
 * One pupil's learning analytics. `audience` adjusts the wording: pupils see
 * friendly headings, adults see the detail.
 */
export function LearningProfileView({ profile, audience = "adult" }: { profile: LearningProfileData; audience?: "adult" | "pupil" }) {
  const pupil = audience === "pupil";
  const { homework, quizzes, attendance, reading } = profile;
  const latestAverage = profile.termTrend.at(-1)?.average ?? null;
  const hasAnything = profile.termTrend.length > 0 || homework.due > 0 || quizzes.taken > 0 || attendance.days > 0;

  if (!hasAnything) {
    return (
      <EmptyState
        icon="ChartLine"
        title={pupil ? "Your progress will show here soon" : "Not enough records yet"}
        description="Progress appears once homework is marked, quizzes are taken, attendance is recorded and results are published."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={pupil ? "My term average" : "Term average"}
          value={latestAverage === null ? "—" : `${latestAverage}%`}
          hint={profile.latestTerm ? profile.latestTerm.name : "No published results yet"}
          icon="Trophy"
          tone={latestAverage === null ? "neutral" : latestAverage >= 70 ? "success" : latestAverage >= 50 ? "info" : "warning"}
        />
        <StatCard
          label="Homework handed in"
          value={homework.rate === null ? "—" : `${homework.rate}%`}
          hint={`${homework.done} of ${homework.due} due${homework.late ? ` · ${homework.late} late` : ""}`}
          icon="ClipboardList"
          tone={homework.rate === null ? "neutral" : homework.rate >= 90 ? "success" : homework.rate >= 75 ? "warning" : "danger"}
        />
        <StatCard
          label="Quiz average"
          value={quizzes.averageScore === null ? "—" : `${quizzes.averageScore}%`}
          hint={`${quizzes.taken} ${quizzes.taken === 1 ? "quiz" : "quizzes"} taken`}
          icon="Puzzle"
          tone="info"
        />
        <StatCard
          label="Attendance (8 weeks)"
          value={attendance.rate === null ? "—" : `${attendance.rate}%`}
          hint={attendance.late ? `${attendance.late} late arrivals` : `${attendance.days} days recorded`}
          icon="CalendarCheck"
          tone={attendance.rate === null ? "neutral" : attendance.rate >= 95 ? "success" : attendance.rate >= 90 ? "warning" : "danger"}
        />
      </div>

      {profile.signals.length > 0 ? (
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">{pupil ? "Things to know" : "What stands out"}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Worked out from marks, homework, quizzes, attendance and reading. These are prompts for a conversation, not judgements.
          </p>
          <Separator className="my-4" />
          <ul className="space-y-2">
            {profile.signals.map((s, i) => (
              <li key={`${s.area}-${i}`} className="flex flex-wrap items-start gap-2 text-sm">
                <StatusPill tone={SIGNAL_TONE[s.tone]} className="shrink-0">
                  {s.area}
                </StatusPill>
                <span className="min-w-0 flex-1 pt-0.5">{s.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Term averages</h2>
          <Separator className="my-4" />
          {profile.termTrend.length >= 2 ? (
            <TrendChart data={profile.termTrend.map((t) => ({ label: t.label, value: t.average }))} caption="Average across all subjects, by term." />
          ) : profile.termTrend.length === 1 ? (
            <p className="text-sm text-muted-foreground">
              {profile.termTrend[0].label}: <span className="font-bold text-foreground">{profile.termTrend[0].average}%</span>, position {profile.termTrend[0].position} of{" "}
              {profile.termTrend[0].classSize}. The trend appears after a second term.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No published results yet.</p>
          )}
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">{pupil ? "My subjects" : "Subjects this term"}</h2>
          <Separator className="my-4" />
          {profile.subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Subject scores appear when results are published.</p>
          ) : (
            <ul className="space-y-2">
              {profile.subjects.map((s) => (
                <li key={s.subjectId} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
                  <span className="min-w-0 truncate font-semibold">{s.subject}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    {s.classAverage !== null ? <span className="text-xs text-muted-foreground tabular-nums">class {s.classAverage}</span> : null}
                    <Change value={s.change} />
                    <span className="w-14 text-right font-heading font-extrabold tabular-nums">
                      {s.total} <span className="text-xs text-muted-foreground">{s.grade}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Homework by subject</h2>
          <Separator className="my-4" />
          {homework.bySubject.length === 0 ? (
            <p className="text-sm text-muted-foreground">No homework due yet.</p>
          ) : (
            <BarChart
              unit="%"
              data={homework.bySubject.map((s) => ({
                label: s.subject,
                value: s.due ? Math.round((s.done / s.due) * 100) : 0,
                hint: `${s.done} of ${s.due} handed in${s.averageScore !== null ? ` · average mark ${s.averageScore}%` : ""}`,
              }))}
            />
          )}
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">{pupil ? "Topics I've practised" : "Mastery by topic"}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Average mark on marked homework for each topic, lowest first.</p>
          <Separator className="my-4" />
          {profile.topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Topics appear once homework is marked.</p>
          ) : (
            <BarChart
              unit="%"
              data={profile.topics.slice(0, 8).map((t) => ({ label: `${t.topic} · ${t.subject}`, value: t.score, hint: `${t.pieces} marked ${t.pieces === 1 ? "piece" : "pieces"}` }))}
            />
          )}
        </Card>
      </div>

      {profile.strengths.length > 0 || profile.focus.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="gap-0 border-success/30 bg-success/5 p-5">
            <h2 className="font-heading text-base font-extrabold">{pupil ? "I'm great at" : "Strengths"}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {profile.strengths.length ? profile.strengths.map((s) => <li key={s.subjectId}>· {s.subject} ({s.total})</li>) : <li className="text-muted-foreground">Keep going — strengths show as results come in.</li>}
            </ul>
          </Card>
          <Card className="gap-0 border-warning/30 bg-warning/5 p-5">
            <h2 className="font-heading text-base font-extrabold">{pupil ? "I'm working on" : "Focus areas"}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {profile.focus.length ? profile.focus.map((s) => <li key={s.subjectId}>· {s.subject} ({s.total})</li>) : <li className="text-muted-foreground">Nothing stands out.</li>}
            </ul>
          </Card>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Reading: {reading.minutes} minutes logged in the last 30 days across {reading.sessions} {reading.sessions === 1 ? "session" : "sessions"}.
      </p>
    </div>
  );
}
