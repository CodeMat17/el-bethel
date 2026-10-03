import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import { ACADEMIC_CALENDAR, CLASS_LEVELS } from "@/lib/school/config";
import { formatDate } from "@/lib/school/format";
import { CircleCheckIcon } from "lucide-react";

import { SessionDialog, TermDialog } from "@/components/admin/academic-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { setActiveTerm } from "@/lib/school/actions/admin";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "Sessions & terms" };

export default async function AdminSessionsPage() {
  await requireAdmin();
  const dir = await getDirectory();
  const db = { sessions: dir.sessions, terms: dir.terms };
  const activeSession = db.sessions.find((s) => s.active);
  const sessionOptions = [...db.sessions].reverse().map((s) => ({ value: s.id, label: s.name }));
  const now = new Date();

  return (
    <>
      <PortalPageHeader
        title="Academic sessions & terms"
        description="Session dates, term dates and examination windows. The current term is used for new assignments and results."
        action={<SessionDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active session" value={activeSession?.name ?? "—"} icon="CalendarRange" tone="gold" />
        <StatCard label="Sessions on record" value={db.sessions.length} icon="Layers" tone="neutral" />
        <StatCard label="Terms configured" value={db.terms.length} icon="CalendarDays" tone="neutral" />
        <StatCard label="Class levels" value={CLASS_LEVELS.length} icon="School" tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <h2 className="font-heading text-base font-extrabold">Sessions</h2>
          {db.sessions
            .slice()
            .reverse()
            .map((session) => {
              const terms = db.terms.filter((t) => t.sessionId === session.id);
              return (
                <Card key={session.id} className={`gap-0 p-5 ${session.active ? "border-gold/40 bg-gold/8" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-lg font-extrabold">{session.name}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatDate(session.startDate)} — {formatDate(session.endDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={session.active ? "gold" : "neutral"}>{session.active ? "Current" : "Not current"}</StatusPill>
                      <SessionDialog session={session} />
                      <TermDialog sessions={sessionOptions} sessionId={session.id} />
                    </div>
                  </div>

                  {terms.length > 0 ? (
                    <>
                      <Separator className="my-4" />
                      <ul className="space-y-2.5">
                        {terms.map((term) => (
                          <li key={term.id} className="rounded-xl border bg-card p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-extrabold">{term.name}</p>
                              <div className="flex flex-wrap items-center gap-1">
                                {term.active ? (
                                  <StatusPill tone="success">Current term</StatusPill>
                                ) : (
                                  <ConfirmAction
                                    action={setActiveTerm.bind(null, term.id)}
                                    icon={<CircleCheckIcon />}
                                    variant="outline"
                                    pendingText="Switching…"
                                    confirm={{ title: `Make ${term.name} the current term?`, description: "New assignments and results will use this term.", confirmLabel: "Make current" }}
                                  >
                                    Make current
                                  </ConfirmAction>
                                )}
                                <TermDialog term={term} sessions={sessionOptions} />
                              </div>
                            </div>
                            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
                              <div>
                                <dt className="font-bold text-muted-foreground uppercase">Term dates</dt>
                                <dd className="mt-0.5">
                                  {formatDate(term.startDate)} — {formatDate(term.endDate)}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-bold text-muted-foreground uppercase">Examinations</dt>
                                <dd className="mt-0.5">
                                  {formatDate(term.examStart)} — {formatDate(term.examEnd)}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-bold text-muted-foreground uppercase">Results published</dt>
                                <dd className="mt-0.5">{formatDate(term.resultPublishDate)}</dd>
                              </div>
                            </dl>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </Card>
              );
            })}
        </div>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Calendar blocks</h2>
            <Separator className="my-4" />
            <ul className="space-y-2.5">
              {ACADEMIC_CALENDAR.map((block) => {
                const current = now >= new Date(block.start) && now <= new Date(block.end);
                return (
                  <li
                    key={block.name}
                    className={`rounded-xl border p-3.5 ${current ? "border-gold/50 bg-gold/10" : "bg-card"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{block.name}</p>
                      {current ? <StatusPill tone="gold">Now</StatusPill> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(block.start)} — {formatDate(block.end)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Promotion pathway</h2>
            <Separator className="my-4" />
            <ol className="space-y-2">
              {CLASS_LEVELS.map((level, i) => (
                <li key={level.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-extrabold">
                    {i + 1}
                  </span>
                  <span className="font-bold">{level.name}</span>
                  {i < CLASS_LEVELS.length - 1 ? (
                    <ArrowRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <span className="ml-auto text-xs font-bold text-gold-foreground dark:text-gold">Graduated</span>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl bg-muted/70 p-3.5 text-xs leading-relaxed text-muted-foreground">
              Promotion at session end preserves every historical record. A previous year&apos;s class,
              results and report cards are never overwritten.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
