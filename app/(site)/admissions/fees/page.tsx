import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, InfoIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMISSION_FEES, FEE_STRUCTURE, OPTIONAL_FEES, CLASS_LEVELS } from "@/lib/school/config";
import { money } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "School Fees",
  description:
    "Termly school fees at El-Bethel International Academy, Abuja, by class band, plus admission and optional fees.",
  alternates: { canonical: "/admissions/fees" },
};

export default function FeesPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="School Fees"
        lede="Published in full, per term, with no hidden extras. Fees are configurable per session, term, class and category by the school administrator."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "Fees", href: "/admissions/fees" },
        ]}
      >
        <Badge className="h-7 bg-gold/20 px-3 font-bold text-gold">Demo values — 2026/2027 session</Badge>
      </PageHero>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Termly fees" title="What a term costs, by class band" />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {FEE_STRUCTURE.map((band, i) => {
              const total = band.lines.reduce((sum, l) => sum + l.amount, 0);
              const levels = CLASS_LEVELS.filter((l) => band.levelIds.includes(l.id));
              return (
                <Reveal key={band.band} delay={i * 0.06}>
                  <Card className={`flex h-full flex-col gap-0 p-6 ${i === 1 ? "border-gold/40 shadow-lg" : ""}`}>
                    <h3 className="font-heading text-lg font-extrabold">{band.band}</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {levels.map((level) => (
                        <Badge key={level.id} variant="secondary" className="font-bold">{level.name}</Badge>
                      ))}
                    </div>
                    <p className="mt-6 font-heading text-3xl leading-none font-extrabold">
                      {money(total)}
                      <span className="ml-1.5 text-sm font-bold text-muted-foreground">/ term</span>
                    </p>
                    <Separator className="my-5" />
                    <ul className="flex-1 space-y-2.5 text-sm">
                      {band.lines.map((line) => (
                        <li key={line.category} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{line.label}</span>
                          <span className="font-bold tabular-nums">{money(line.amount)}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-6 w-full font-bold"
                      size="lg"
                      variant={i === 1 ? "default" : "outline"}
                      render={<Link href="/admissions/apply" />}
                    >
                      Apply for this band
                      <ArrowRightIcon />
                    </Button>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="One-off" title="Admission fees" lede="Paid once, at the point of application and enrolment." />
            <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ADMISSION_FEES.map((fee) => (
                    <TableRow key={fee.label}>
                      <TableCell className="font-semibold">{fee.label}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{money(fee.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="Optional" title="Optional services" lede="Added to your termly invoice only if you choose them." />
            <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {OPTIONAL_FEES.map((fee) => (
                    <TableRow key={fee.category}>
                      <TableCell className="font-semibold">{fee.label}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{money(fee.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "When fees are due", text: "Termly invoices are issued two weeks before resumption and are due by the end of the second week of term." },
            { title: "Payment methods", text: "Card, bank transfer or USSD through Paystack or Flutterwave. Receipts are generated automatically once a payment is verified." },
            { title: "Instalment plans", text: "Available on request. Contact the school accountant before the start of term to agree a schedule." },
            { title: "Sibling consideration", text: "Families with three or more children enrolled receive a discount on the third and subsequent child. Contact the office for details." },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 0.05}>
              <Card className="h-full gap-0 p-6">
                <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="eb-container mt-8">
          <Card className="gap-0 border-info/30 bg-info/10 p-5">
            <p className="flex items-start gap-2.5 text-sm leading-relaxed">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-info" />
              <span>
                <span className="font-extrabold">These are demonstration values.</span> In a live
                deployment every figure on this page is maintained by the school administrator per
                academic session, term, class and fee category — no code change is required to update them.
              </span>
            </p>
          </Card>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
