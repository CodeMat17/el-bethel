import Link from "next/link";
import type { Metadata } from "next";
import { RefreshCwIcon, StarIcon, TrashIcon } from "lucide-react";

import { AchievementDialog } from "@/components/admin/operations-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { recalculateHousePoints, removeAchievement } from "@/lib/school/actions/operations";
import { HouseTable } from "@/components/portal/stars";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { formatDate, formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Achievements" };

export default async function AdminAchievementsPage() {
  await requireAdmin();
  const [items, houses, dir] = await Promise.all([query(api.awards.adminAchievements, {}), query(api.gamification.houseStandings, {}), getDirectory()]);
  const computedAt = houses.find((h) => h.computedAt)?.computedAt;
  const classNames = Object.fromEntries(dir.classes.map((c) => [c.id, c.name]));

  return (
    <>
      <PortalPageHeader
        title="Our Stars"
        description="Pupil achievements. Published stars appear on the public website with initials and year group only."
        action={<AchievementDialog classNames={classNames} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Achievements" value={items.length} icon="Star" tone="gold" />
        <StatCard label="On the public site" value={items.filter((a) => a.published).length} icon="Sparkles" tone="info" />
        <StatCard label="Linked to a pupil" value={items.filter((a) => a.studentId).length} icon="Backpack" tone="neutral" />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-extrabold">House points</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pupils earn stars for homework, reading and awards; each pupil&apos;s stars count for their house.
              {computedAt ? ` Last worked out ${formatDateTime(computedAt)}.` : " Worked out every night."}
            </p>
          </div>
          <ConfirmAction action={recalculateHousePoints} icon={<RefreshCwIcon />} pendingText="Starting…">
            Recalculate now
          </ConfirmAction>
        </div>
        <Separator className="my-4" />
        <HouseTable houses={houses} mine="" />
      </Card>

      <p className="mb-4 text-sm text-muted-foreground">
        Certificates for these achievements are managed on the{" "}
        <Link href="/portal/admin/certificates" className="font-bold text-primary underline-offset-4 hover:underline dark:text-gold">
          Certificates
        </Link>{" "}
        page.
      </p>

      {items.length === 0 ? (
        <EmptyState icon="Star" title="No achievements yet" description="Add the first star to celebrate a pupil." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Card key={a.id} className="flex h-full flex-col gap-0 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[0.65rem] font-extrabold text-gold-foreground uppercase dark:text-gold">
                  <StarIcon className="size-3" /> {a.category}
                </span>
                <StatusPill tone={a.published ? "success" : "neutral"}>{a.published ? "Public" : "Hidden"}</StatusPill>
              </div>
              <h2 className="mt-3 font-heading text-base font-extrabold">{a.title}</h2>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{a.description}</p>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{a.studentName ?? a.studentInitials}</span> · {a.classLabel} · {formatDate(a.date)}
              </p>
              <div className="mt-3 flex justify-end gap-1">
                <AchievementDialog achievement={a} classNames={classNames} />
                <ConfirmAction
                  action={removeAchievement.bind(null, a.id)}
                  icon={<TrashIcon />}
                  variant="ghost"
                  className="font-bold text-destructive"
                  destructive
                  pendingText="Removing…"
                  confirm={{ title: "Remove this achievement?", description: "It disappears from Our Stars. Any certificate already issued stays valid.", confirmLabel: "Remove" }}
                >
                  Remove
                </ConfirmAction>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
