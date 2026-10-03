import type { Metadata } from "next";
import { StarIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Icon } from "@/components/icon";
import { PortalPageHeader } from "@/components/portal/page-header";
import { BadgeGrid, HouseTable, StarsSummary } from "@/components/portal/stars";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { formatDate, formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "My stars" };

export default async function PupilStarsPage() {
  const user = await requirePupil();
  if (!user.studentId) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }
  const [stars, achievements, certificates] = await Promise.all([
    query(api.gamification.forStudent, { studentId: user.studentId }),
    query(api.awards.achievementsForStudent, { studentId: user.studentId }),
    query(api.awards.certificatesForStudent, { studentId: user.studentId }),
  ]);
  if (!stars) return <EmptyState icon="Star" title="No stars yet" description="Your stars will appear here." />;
  const earned = stars.badges.filter((b) => b.earned).length;
  const updated = stars.houses.find((h) => h.computedAt)?.computedAt;

  return (
    <>
      <PortalPageHeader
        title="My stars"
        description="You earn stars for handing in homework on time, quizzes, coming to school, reading and awards."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <StarsSummary data={stars} />
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Where my stars come from</h2>
          <Separator className="my-4" />
          <ul className="space-y-2.5">
            {stars.breakdown.map((b) => (
              <li key={b.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <Icon name={b.icon} className="size-4 text-gold" />
                  {b.label}
                </span>
                <span className="font-bold tabular-nums">{b.points}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-extrabold">
          My badges <span className="text-sm font-bold text-muted-foreground">· {earned} of {stars.badges.length}</span>
        </h2>
        <div className="mt-4">
          <BadgeGrid badges={stars.badges} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">House points</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your stars also count for {stars.house} House.{updated ? ` Updated ${formatDateTime(updated)}.` : " Totals are worked out every night."}
          </p>
          <Separator className="my-4" />
          <HouseTable houses={stars.houses} mine={stars.house} />
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">My awards</h2>
          <Separator className="my-4" />
          {achievements.length === 0 && certificates.length === 0 ? (
            <div className="py-6 text-center">
              <StarIcon className="mx-auto size-9 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No awards yet — keep trying your best!</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {achievements.map((a) => (
                <li key={a.id} className="rounded-xl border border-gold/30 bg-gold/8 p-3.5">
                  <p className="text-sm font-extrabold">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.category} · {formatDate(a.date)}
                  </p>
                </li>
              ))}
              {certificates
                .filter((c) => !c.revokedAt)
                .map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold">{c.award}</p>
                      <p className="truncate text-xs text-muted-foreground">Certificate · {c.certificateNo}</p>
                    </div>
                    <a href={`/api/certificates/${c.id}`} className="shrink-0 text-xs font-bold text-primary underline-offset-4 hover:underline dark:text-gold">
                      Download
                    </a>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
