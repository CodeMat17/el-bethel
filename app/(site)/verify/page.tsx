import type { Metadata } from "next";
import { BadgeCheckIcon, CircleAlertIcon, SearchIcon } from "lucide-react";

import { PageHero } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SCHOOL } from "@/lib/school/config";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = {
  title: "Verify a Certificate",
  description:
    "Verify the authenticity of a certificate issued by El-Bethel International Academy using its certificate number.",
  alternates: { canonical: "/verify" },
};

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const params = await searchParams;
  const certificateNo = typeof params.no === "string" ? params.no.trim() : "";

  const certificate = certificateNo
    ? getDb().certificates.find((c) => c.certificateNo.toLowerCase() === certificateNo.toLowerCase()) ?? null
    : null;

  return (
    <>
      <PageHero
        eyebrow="Verification"
        title="Verify a certificate"
        lede="Enter the certificate number printed on an El-Bethel International Academy certificate to confirm it is genuine."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Verify", href: "/verify" }]}
      />

      <section className="eb-section">
        <div className="eb-container max-w-2xl">
          <Card className="gap-0 p-6 sm:p-8">
            <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="no" className="mb-1.5 block text-xs font-bold uppercase">
                  Certificate number
                </label>
                <Input
                  id="no"
                  name="no"
                  defaultValue={certificateNo}
                  placeholder="EIA-2026-00021"
                  required
                  className="h-11"
                />
              </div>
              <Button type="submit" size="lg" className="h-11 font-bold">
                <SearchIcon />
                Verify
              </Button>
            </form>

            {certificateNo && certificate ? (
              <div className="mt-8 rounded-2xl border border-success/40 bg-success/10 p-6">
                <div className="flex items-center gap-3">
                  <BadgeCheckIcon className="size-8 shrink-0 text-success" />
                  <div>
                    <p className="font-heading text-lg font-extrabold text-success">Certificate verified</p>
                    <p className="text-sm text-muted-foreground">
                      This certificate was issued by {SCHOOL.name}.
                    </p>
                  </div>
                </div>
                <Separator className="my-5" />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Certificate number</dt>
                    <dd className="mt-0.5 font-mono text-sm font-bold">{certificate.certificateNo}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Award</dt>
                    <dd className="mt-0.5 text-sm font-semibold">{certificate.award}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Session</dt>
                    <dd className="mt-0.5 text-sm font-semibold">{certificate.sessionName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Issued</dt>
                    <dd className="mt-0.5 text-sm font-semibold">{formatDate(certificate.issuedAt)}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                  For the protection of the child, no pupil name or other personal information is shown
                  on this public verification page.
                </p>
              </div>
            ) : null}

            {certificateNo && !certificate ? (
              <div
                role="alert"
                className="mt-8 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-6"
              >
                <CircleAlertIcon className="mt-0.5 size-6 shrink-0 text-destructive" />
                <div>
                  <p className="font-heading text-base font-extrabold text-destructive">
                    We could not verify that certificate
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    No certificate matches the number <span className="font-mono font-bold">{certificateNo}</span>.
                    Check the number carefully — it should look like EIA-2026-00021. If you believe the
                    certificate is genuine, please contact the school office.
                  </p>
                </div>
              </div>
            ) : null}

            {!certificateNo ? (
              <p className="mt-6 rounded-xl bg-muted/70 p-4 text-sm leading-relaxed text-muted-foreground">
                Certificate numbers appear at the foot of every certificate we issue, and are encoded in
                the QR code printed alongside them. Try <span className="font-mono font-bold text-foreground">EIA-2026-00021</span> to
                see a verified result.
              </p>
            ) : null}
          </Card>
        </div>
      </section>
    </>
  );
}
