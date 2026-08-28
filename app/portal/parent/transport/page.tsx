import type { Metadata } from "next";
import { BusIcon, ShieldCheckIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import { childrenForSession, classDisplayName, studentName } from "@/lib/school/data";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Transport" };

export default async function ParentTransportPage() {
  const user = await requireParent();
  const myChildren = childrenForSession(user);
  const routes = getDb().transportRoutes;

  const usingTransport = myChildren.filter((c) => c.transportRouteId);

  return (
    <>
      <PortalPageHeader
        title="School transport"
        description="Route, stop times, driver and attendant details for each child using the school bus."
      />

      {usingTransport.length === 0 ? (
        <EmptyState
          icon="Bus"
          title="No child is currently using school transport"
          description="Transport is an optional service charged per term. Contact the school office to add a child to a route."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {usingTransport.map((child) => {
            const route = routes.find((r) => r.id === child.transportRouteId);
            if (!route) return null;
            return (
              <Card key={child.id} className="gap-0 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-base font-extrabold">{studentName(child)}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{classDisplayName(child.classId)}</p>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-extrabold text-gold-foreground dark:text-gold">
                    <BusIcon className="size-3.5" />
                    {route.busNo}
                  </span>
                </div>

                <Separator className="my-5" />

                <p className="text-sm font-extrabold">{route.route}</p>
                <ol className="mt-3 space-y-2.5">
                  {route.stops.map((stop) => (
                    <li key={stop.name} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
                      <span className="font-semibold">{stop.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {stop.pickupTime} · {stop.dropoffTime}
                      </span>
                    </li>
                  ))}
                </ol>

                <Separator className="my-5" />

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Driver</dt>
                    <dd className="mt-0.5 font-semibold">{route.driver}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Attendant</dt>
                    <dd className="mt-0.5 font-semibold">{route.attendant}</dd>
                  </div>
                </dl>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="flex items-start gap-3 text-sm leading-relaxed">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            Every bus carries a trained attendant in addition to the driver, and each child is checked on
            and off by name. Live bus tracking with pickup and drop-off notifications is currently in
            pilot and will be enabled route by route.
          </span>
        </p>
      </Card>
    </>
  );
}
