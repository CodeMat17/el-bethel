import Link from "next/link";

import { SCHOOL } from "@/lib/school/config";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-navy-foreground shadow-sm ring-1 ring-gold/30",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-6" fill="none">
        <path d="M16 3 4 9v6c0 7.2 4.9 12.6 12 14 7.1-1.4 12-6.8 12-14V9L16 3Z" className="fill-gold/20" />
        <path
          d="M16 3 4 9v6c0 7.2 4.9 12.6 12 14 7.1-1.4 12-6.8 12-14V9L16 3Z"
          className="stroke-gold"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9.5 14.5h13M16 9v11" className="stroke-gold" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Brand({
  className,
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <BrandMark />
      <span className="flex min-w-0 flex-col leading-none">
        {/* The full name is too wide for a phone header — the short name carries it there. */}
        <span className="truncate font-heading text-[0.95rem] font-extrabold tracking-tight sm:text-base">
          {compact ? (
            SCHOOL.shortName
          ) : (
            <>
              <span className="sm:hidden">{SCHOOL.shortName}</span>
              <span className="hidden sm:inline">{SCHOOL.name}</span>
            </>
          )}
        </span>
        <span className="mt-0.5 truncate text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {compact ? "Digital School" : SCHOOL.motto}
        </span>
      </span>
    </Link>
  );
}
