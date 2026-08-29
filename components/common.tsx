import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ToneName } from "@/lib/school/format";
import { cn } from "@/lib/utils";

/* ------------------------------ section head ------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        action && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <span className="eb-eyebrow">{eyebrow}</span> : null}
        <h2 className={cn("eb-title", eyebrow && "mt-4")}>{title}</h2>
        {lede ? <p className="eb-lede mt-4">{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* --------------------------------- pills ---------------------------------- */

const TONE_CLASSES: Record<ToneName, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  success: "bg-success/12 text-success ring-success/25 dark:text-success",
  warning: "bg-warning/15 text-warning ring-warning/30 dark:text-warning",
  danger: "bg-destructive/12 text-destructive ring-destructive/25",
  info: "bg-info/12 text-info ring-info/25",
  gold: "bg-gold/15 text-gold-foreground ring-gold/35 dark:text-gold",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
  dot = true,
}: {
  tone?: ToneName;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ring-1 ring-inset",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/* ------------------------------- stat cards ------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: string;
  tone?: ToneName;
  href?: string;
  className?: string;
}) {
  const body = (
    <Card
      className={cn(
        "h-full gap-0 p-4 transition-colors sm:p-5",
        href && "hover:border-gold/50 hover:bg-accent/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
        {icon ? (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
              TONE_CLASSES[tone],
            )}
          >
            <Icon name={icon} className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-heading text-2xl leading-none font-extrabold tabular-nums sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ------------------------------ empty states ------------------------------ */

export function EmptyState({
  icon = "Sparkles",
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("rounded-2xl border border-dashed bg-card/40 py-12", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name={icon} className="size-6" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

/* ------------------------------- page header ------------------------------ */

export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  breadcrumb,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children?: React.ReactNode;
  breadcrumb?: { label: string; href: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-b bg-navy text-navy-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(60rem 30rem at 15% -10%, color-mix(in oklch, var(--gold) 40%, transparent), transparent 70%), radial-gradient(45rem 25rem at 95% 20%, color-mix(in oklch, var(--info) 45%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="eb-container relative py-12 sm:py-16 lg:py-20">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-navy-foreground/60">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                {i > 0 ? <span aria-hidden>/</span> : null}
                <Link href={crumb.href} className="transition-colors hover:text-gold">
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        ) : null}
        {eyebrow ? (
          <Badge className="mb-4 h-6 bg-gold/20 px-3 text-[0.68rem] font-extrabold tracking-[0.14em] text-gold uppercase">
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="max-w-3xl text-balance font-heading text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {lede ? (
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-navy-foreground/75 sm:text-lg">
            {lede}
          </p>
        ) : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}

/* --------------------------------- CTA band ------------------------------- */

export function CtaBand({
  title = "Ready to join the El-Bethel family?",
  text = "Admission for the 2026/2027 session is open for Primary 1 to Primary 4. Spaces in some classes are limited.",
  primary = { label: "Apply for admission", href: "/admissions/apply" },
  secondary = { label: "Book a school tour", href: "/contact/tour" },
}: {
  title?: string;
  text?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Card className="overflow-hidden border-gold/25 bg-navy p-0 text-navy-foreground">
          <CardContent className="relative grid gap-6 p-8 sm:p-12 lg:grid-cols-[1.6fr_1fr] lg:items-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(40rem 20rem at 90% 0%, color-mix(in oklch, var(--gold) 35%, transparent), transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="font-heading text-2xl leading-tight text-balance sm:text-3xl">{title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/75 sm:text-base">
                {text}
              </p>
            </div>
            <div className="relative flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button
                size="lg"
                className="h-12 w-full bg-gold text-base font-bold text-gold-foreground hover:bg-gold/85"
                render={<Link href={primary.href} />}
              >
                {primary.label}
                <ArrowRightIcon />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full border-navy-foreground/25 bg-transparent text-base font-bold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
                render={<Link href={secondary.href} />}
              >
                {secondary.label}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
