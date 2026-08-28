import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  action,
  breadcrumb,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      {breadcrumb ? (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb.href}>
              {i > 0 ? <span aria-hidden>/</span> : null}
              <Link href={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[0.65rem] font-extrabold tracking-[0.16em] text-gold-foreground uppercase dark:text-gold">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-balance font-heading text-2xl leading-tight font-extrabold sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
