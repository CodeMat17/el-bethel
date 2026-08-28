import type { Metadata } from "next";
import { BusIcon, PlusIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import { classDisplayName, studentName } from "@/lib/school/data";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Transport" };

export default async function AdminTransportPage() {
  await requireAdmin();
  const db = getDb();
  const routes = db.transportRoutes;
  const riders = db.students.filter((s) => s.transportRouteId);
  const capacity = routes.reduce((sum, r) => sum + r.capacity, 0);

  return (
    <>
      <PortalPageHeader
        title="Transport"
        description="Routes, stops, drivers, attendants and which pupils travel on each bus."
        action={
          <Button size="lg" className="font-bold" disabled>
            <PlusIcon />
            Add route
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Routes" value={routes.length} icon="Bus" tone="info" />
        <StatCard label="Pupils travelling" value={riders.length} icon="Backpack" tone="gold" />
        <StatCard label="Total capacity" value={capacity} icon="Truck" tone="neutral" />
        <StatCard
          label="Seats free"
          value={Math.max(0, capacity - riders.length)}
          icon="CircleCheck"
          tone={capacity - riders.length > 0 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {routes.map((route) => {
          const onRoute = riders.filter((s) => s.transportRouteId === route.id);
          const fill = Math.round((onRoute.length / route.capacity) * 100);
          return (
            <Card key={route.id} className="gap-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-extrabold">{route.route}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {route.driver} · attendant {route.attendant}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-extrabold text-gold-foreground dark:text-gold">
                  <BusIcon className="size-3.5" />
                  {route.busNo}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs font-bold">
                  <span>Occupancy</span>
                  <span className="tabular-nums text-muted-foreground">
                    {onRoute.length} of {route.capacity}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${fill > 100 ? "bg-destructive" : "bg-viz-3"}`}
                    style={{ width: `${Math.min(100, fill)}%` }}
                  />
                </div>
              </div>

              <Separator className="my-5" />

              <p className="text-xs font-bold text-muted-foreground uppercase">Stops</p>
              <ol className="mt-2.5 space-y-2">
                {route.stops.map((stop) => (
                  <li key={stop.name} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
                    <span className="min-w-0 truncate font-semibold">{stop.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {stop.pickupTime} · {stop.dropoffTime}
                    </span>
                  </li>
                ))}
              </ol>

              {onRoute.length > 0 ? (
                <>
                  <Separator className="my-5" />
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    Pupils on this route
                  </p>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {onRoute.slice(0, 12).map((student) => (
                      <li key={student.id}>
                        <StatusPill tone="neutral" dot={false}>
                          {studentName(student)} · {classDisplayName(student.classId)}
                        </StatusPill>
                      </li>
                    ))}
                    {onRoute.length > 12 ? (
                      <li>
                        <StatusPill tone="gold" dot={false}>+{onRoute.length - 12} more</StatusPill>
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="text-sm leading-relaxed">
          <span className="font-extrabold">Safety · </span>
          Every bus carries a trained attendant in addition to the driver, and each child is checked on
          and off by name. Live tracking with automatic pickup and drop-off notifications is in pilot.
        </p>
      </Card>
    </>
  );
}
