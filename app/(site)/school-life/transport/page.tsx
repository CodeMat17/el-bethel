import type { Metadata } from "next";
import { BusIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OPTIONAL_FEES } from "@/lib/school/config";
import { money } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = {
  title: "School Transport",
  description:
    "Four school bus routes across Abuja with vetted drivers, trained attendants, logged pickups and parent notifications.",
  alternates: { canonical: "/school-life/transport" },
};

const SAFETY = [
  { title: "Vetted drivers", icon: ShieldCheckIcon, text: "Every driver holds a valid licence, passes a background check and completes annual defensive-driving training." },
  { title: "A trained attendant on every bus", icon: UserRoundIcon, text: "No bus leaves without an attendant. They manage seating, seat belts, boarding and the register." },
  { title: "Logged pickup and drop-off", icon: BusIcon, text: "Each child is checked on and off by name. Parents receive an in-app notification at both ends of the journey." },
];

export default function TransportPage() {
  const routes = getDb().transportRoutes;
  const transportFee = OPTIONAL_FEES.find((f) => f.category === "transport");

  return (
    <>
      <PageHero
        eyebrow="School life"
        title="School Transport"
        lede="Four routes covering Ushafa, Utako, Wuse, Maitama, Katampe, Gwarinpa, Life Camp, Lokogoma and Galadimawa."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Transport", href: "/school-life/transport" },
        ]}
      >
        {transportFee ? (
          <Badge className="h-7 bg-gold/20 px-3 font-bold text-gold">
            {money(transportFee.amount)} per term — optional
          </Badge>
        ) : null}
      </PageHero>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Safety first" title="What we will not compromise on" align="center" />
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {SAFETY.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <Card className="h-full gap-0 p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                    <item.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Routes"
            title="Four routes, with published stop times"
            lede="Times are approximate and adjusted for traffic. Parents are notified of any change the evening before."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {routes.map((route, i) => (
              <Reveal key={route.id} delay={i * 0.05}>
                <Card className="h-full gap-0 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-lg font-extrabold">{route.route}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">Bus {route.busNo}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-bold">{route.capacity} seats</Badge>
                  </div>

                  <Separator className="my-5" />

                  <ol className="space-y-3">
                    {route.stops.map((stop) => (
                      <li key={stop.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold">{stop.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {stop.pickupTime} · {stop.dropoffTime}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <Separator className="my-5" />

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="font-bold text-muted-foreground uppercase">Driver</dt>
                      <dd className="mt-0.5 font-semibold">{route.driver}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground uppercase">Attendant</dt>
                      <dd className="mt-0.5 font-semibold">{route.attendant}</dd>
                    </div>
                  </dl>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container max-w-3xl">
          <SectionHeading eyebrow="Coming soon" title="Live bus tracking" align="center" />
          <Card className="mt-8 gap-0 border-gold/25 bg-gold/8 p-6">
            <p className="text-sm leading-relaxed">
              We are piloting live bus tracking for the Parent Portal: the current location of your
              child&apos;s bus, an estimated arrival time at your stop, and automatic pickup and drop-off
              notifications. This will be rolled out route by route once safety and data-protection
              reviews are complete.
            </p>
          </Card>
        </div>
      </section>

      <CtaBand
        title="Need a stop we don't currently serve?"
        text="Tell us where you are. We review route coverage at the start of every session and adjust where there is demand."
        primary={{ label: "Contact the school office", href: "/contact" }}
        secondary={{ label: "See fees", href: "/admissions/fees" }}
      />
    </>
  );
}
