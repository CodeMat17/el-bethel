import type { Metadata } from "next";
import { TrashIcon, XIcon } from "lucide-react";

import { ResourceDialog } from "@/components/admin/premium-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { releaseHold, removeDigitalResource } from "@/lib/school/actions/premium";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS } from "@/lib/school/config";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Digital library" };

const KIND_LABEL = { ebook: "E-book", audiobook: "Audiobook", video: "Read-along video", article: "Article" } as const;

export default async function AdminDigitalLibraryPage() {
  await requireAdmin();
  const [data, dir] = await Promise.all([query(api.reading.adminOverview, {}), getDirectory()]);
  const categories = Array.from(new Set(["Stories", ...data.resources.map((r) => r.category)])).sort();
  const levelName = (id: string) => CLASS_LEVELS.find((l) => l.id === id)?.name ?? id;

  return (
    <>
      <PortalPageHeader
        title="Digital library"
        description="E-books, audiobooks and read-along videos for each class, book reservations, and how much pupils are reading."
        breadcrumb={[
          { label: "Library", href: "/portal/admin/library" },
          { label: "Digital library", href: "/portal/admin/library/digital" },
        ]}
        action={<ResourceDialog categories={categories} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Digital titles" value={data.resources.filter((r) => r.published).length} icon="Headphones" tone="info" />
        <StatCard label="Reading (30 days)" value={`${data.reading.minutes.toLocaleString("en-NG")} min`} hint={`${data.reading.readers} pupils`} icon="BookOpen" tone="success" />
        <StatCard label="Books finished" value={data.reading.finished} hint="Last 30 days" icon="CircleCheck" tone="gold" />
        <StatCard
          label="Reservations"
          value={data.holds.length}
          hint={`${data.holds.filter((h) => h.status === "ready").length} waiting at the desk`}
          icon="BookMarked"
          tone={data.holds.some((h) => h.status === "ready") ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Titles</h2>
          <Separator className="my-4" />
          {data.resources.length === 0 ? (
            <EmptyState icon="Headphones" title="No digital titles yet" description="Add open-licence e-books and read-alongs for each class." />
          ) : (
            <ul className="space-y-2.5">
              {data.resources.map((r) => (
                <li key={r.id} className="rounded-xl border bg-card p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.author} · {KIND_LABEL[r.kind]} · {r.category} · opened {r.opens} times
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{r.levelIds.length ? r.levelIds.map(levelName).join(", ") : "All classes"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!r.published ? <StatusPill tone="neutral">Hidden</StatusPill> : null}
                      <ResourceDialog resource={r} categories={categories} />
                      <ConfirmAction
                        action={removeDigitalResource.bind(null, r.id)}
                        variant="ghost"
                        icon={<TrashIcon />}
                        className="font-bold text-destructive"
                        destructive
                        pendingText="Removing…"
                        confirm={{ title: `Remove "${r.title}"?`, description: "Reading diary entries that mention it are kept.", confirmLabel: "Remove" }}
                      >
                        <span className="sr-only">Remove</span>
                      </ConfirmAction>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Reservations</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              When a reserved book is returned, it is set aside and the family is told. Issue it from the Library page; release it if it isn&apos;t collected.
            </p>
            <Separator className="my-4" />
            {data.holds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reservations.</p>
            ) : (
              <ul className="space-y-2">
                {data.holds.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{h.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.studentName} · {h.classId ? dir.className(h.classId) : "—"} · since {formatDate(h.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusPill tone={h.status === "ready" ? "warning" : "info"}>{h.status === "ready" ? "At the desk" : "Waiting"}</StatusPill>
                      <ConfirmAction
                        action={releaseHold.bind(null, h.id)}
                        variant="ghost"
                        icon={<XIcon />}
                        pendingText="Releasing…"
                        confirm={{ title: "Release this reservation?", description: "The next pupil in the queue gets the copy.", confirmLabel: "Release" }}
                      >
                        <span className="sr-only">Release</span>
                      </ConfirmAction>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Top readers (30 days)</h2>
            <Separator className="my-4" />
            {data.reading.topReaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reading logged yet.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {data.reading.topReaders.map((r, i) => (
                  <li key={r.studentId} className="flex items-center justify-between gap-2">
                    <span>
                      <span className="mr-2 font-bold text-muted-foreground">{i + 1}.</span>
                      {r.name} <span className="text-xs text-muted-foreground">· {dir.className(r.classId)}</span>
                    </span>
                    <span className="font-bold tabular-nums">{r.minutes} min</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
