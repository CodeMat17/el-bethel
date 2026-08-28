import type { Metadata } from "next";
import { ShieldCheckIcon } from "lucide-react";

import { StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/school/auth";
import {
  ADMISSION_FEES,
  ASSESSMENT_WEIGHTING,
  CONDUCT_TRAITS,
  MAX_UPLOAD_BYTES,
  SCHOOL,
  SCHOOL_STATS,
} from "@/lib/school/config";
import { fileSize, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "Settings" };

const TOGGLES = [
  { key: "positions", label: "Show class position on report cards", detail: "Ranks pupils within their class.", on: true },
  { key: "attendance-alerts", label: "Attendance alerts to parents", detail: "Notify a family when a child is marked absent.", on: true },
  { key: "sms", label: "SMS notifications", detail: "Send critical alerts by SMS in addition to in-app.", on: true },
  { key: "self-service", label: "Online admission applications", detail: "Allow families to apply through the website.", on: true },
  { key: "resubmission", label: "Allow assignment resubmission by default", detail: "Teachers can still override per assignment.", on: true },
  { key: "gallery-consent", label: "Require consent before publishing a pupil image", detail: "Blocks publication until consent is recorded.", on: true },
];

const INTEGRATIONS = [
  { name: "Paystack", role: "Payments", status: "Configured" },
  { name: "Flutterwave", role: "Payments", status: "Configured" },
  { name: "Resend", role: "Transactional email", status: "Configured" },
  { name: "SMS provider", role: "Critical alerts", status: "Configured" },
  { name: "Cloudinary", role: "Private file storage", status: "Configured" },
];

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <>
      <PortalPageHeader
        title="School settings"
        description="School identity, academic policy, statistics and platform integrations."
      />

      <Tabs defaultValue="school">
        <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
          {[
            ["school", "School"],
            ["academic", "Academic policy"],
            ["finance", "Finance"],
            ["platform", "Platform"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="text-xs font-bold whitespace-nowrap sm:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="school" className="mt-6 space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">School identity</h2>
            <Separator className="my-5" />
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Name", SCHOOL.name],
                ["Short name", SCHOOL.shortName],
                ["Type", SCHOOL.type],
                ["Motto", SCHOOL.motto],
                ["Established", String(SCHOOL.established)],
                ["Academic session", SCHOOL.session],
                ["Address", SCHOOL.address],
                ["Phone", SCHOOL.phone],
                ["Email", SCHOOL.email],
                ["Admissions email", SCHOOL.admissionsEmail],
                ["Office hours", SCHOOL.officeHours],
                ["Headteacher", SCHOOL.headteacher],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Homepage statistics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The animated counters on the public homepage. Editable without a code change.
            </p>
            <Separator className="my-5" />
            <div className="grid gap-3 sm:grid-cols-4">
              {SCHOOL_STATS.map((stat) => (
                <div key={stat.key} className="rounded-xl border bg-card p-4 text-center">
                  <p className="font-heading text-xl font-extrabold">
                    {stat.value}
                    {stat.suffix}
                  </p>
                  <p className="mt-1 text-[0.65rem] font-bold text-muted-foreground uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="mt-6 space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Assessment weighting</h2>
            <Separator className="my-5" />
            <div className="grid gap-3 sm:grid-cols-4">
              {ASSESSMENT_WEIGHTING.map((weighting) => (
                <div key={weighting.component} className="rounded-xl border bg-card p-4 text-center">
                  <p className="font-heading text-2xl font-extrabold">{weighting.weight}%</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">{weighting.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Continuous assessment carries 40 percent, the examination 60 percent. Weightings must total 100.
            </p>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Conduct traits on report cards</h2>
            <Separator className="my-5" />
            <div className="flex flex-wrap gap-2">
              {CONDUCT_TRAITS.map((trait) => (
                <Badge key={trait} variant="secondary" className="h-7 px-3 font-bold">{trait}</Badge>
              ))}
            </div>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Policy switches</h2>
            <Separator className="my-5" />
            <ul className="space-y-4">
              {TOGGLES.map((toggle) => (
                <li key={toggle.key} className="flex items-start justify-between gap-4">
                  <label htmlFor={toggle.key} className="min-w-0 cursor-pointer">
                    <span className="block text-sm font-bold">{toggle.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{toggle.detail}</span>
                  </label>
                  <Switch id={toggle.key} defaultChecked={toggle.on} />
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {ADMISSION_FEES.map((fee) => (
              <StatCard key={fee.label} label={fee.label} value={money(fee.amount)} icon="Receipt" tone="neutral" />
            ))}
          </div>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Payment providers</h2>
            <Separator className="my-5" />
            <ul className="space-y-2.5">
              {INTEGRATIONS.filter((i) => i.role === "Payments").map((integration) => (
                <li key={integration.name} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                  <div>
                    <p className="text-sm font-extrabold">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.role}</p>
                  </div>
                  <Badge className="font-bold">{integration.status}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-muted/70 p-4 text-xs leading-relaxed text-muted-foreground">
              Provider credentials live in environment variables and are never exposed to the browser.
              A payment is only ever marked successful after server-side verification.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="mt-6 space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Integrations</h2>
            <Separator className="my-5" />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {INTEGRATIONS.map((integration) => (
                <li key={integration.name} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                  <div>
                    <p className="text-sm font-extrabold">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.role}</p>
                  </div>
                  <Badge variant="secondary" className="font-bold">{integration.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
              <ShieldCheckIcon className="size-4 text-gold" />
              Security posture
            </h2>
            <Separator className="my-5" />
            <ul className="grid gap-2.5 text-sm sm:grid-cols-2">
              {[
                "Server-side authorisation on every route and action",
                "Roles read from the database, never from the browser",
                "Signed, HTTP-only session cookies with an 8-hour lifetime",
                `Upload validation: type and size, maximum ${fileSize(MAX_UPLOAD_BYTES)}`,
                "Private documents served through short-lived signed URLs",
                "Payments verified server-side with the provider",
                "Append-only audit log for administrative actions",
                "Portals excluded from search engine indexing",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-xs text-muted-foreground">
        Saving settings is disabled in this demonstration environment. Every value shown here is data,
        not code — a live deployment edits them from this screen and records the change in the audit log.
      </p>
    </>
  );
}
