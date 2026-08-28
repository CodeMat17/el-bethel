import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const APPLY_STEPS = [
  { key: "account", label: "Account", href: "/admissions/apply?step=account" },
  { key: "pupil", label: "Pupil", href: "/admissions/apply?step=pupil" },
  { key: "guardian", label: "Parent", href: "/admissions/apply?step=guardian" },
  { key: "documents", label: "Documents", href: "/admissions/apply?step=documents" },
  { key: "review", label: "Review", href: "/admissions/apply?step=review" },
  { key: "payment", label: "Payment", href: "/admissions/apply?step=payment" },
  { key: "submit", label: "Submit", href: "/admissions/apply?step=submit" },
] as const;

export type ApplyStepKey = (typeof APPLY_STEPS)[number]["key"];

export function WizardProgress({
  current,
  reachable,
}: {
  current: ApplyStepKey;
  reachable: ApplyStepKey[];
}) {
  const currentIndex = APPLY_STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Application progress">
      {/* Mobile: compact progress */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="font-heading text-sm font-extrabold">
            Step {currentIndex + 1} of {APPLY_STEPS.length}
          </p>
          <p className="text-sm font-bold text-muted-foreground">{APPLY_STEPS[currentIndex]?.label}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / APPLY_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full stepper */}
      <ol className="hidden items-center gap-1 sm:flex">
        {APPLY_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const canGo = reachable.includes(step.key) && !active;
          const content = (
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-colors",
                active && "bg-navy text-navy-foreground",
                done && "text-foreground",
                !active && !done && "text-muted-foreground",
                canGo && "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] font-extrabold ring-1",
                  active && "bg-gold text-gold-foreground ring-gold",
                  done && "bg-success text-success-foreground ring-success",
                  !active && !done && "ring-border",
                )}
              >
                {done ? <CheckIcon className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              {step.label}
            </span>
          );
          return (
            <li key={step.key} className="flex items-center">
              {canGo ? <Link href={step.href}>{content}</Link> : content}
              {i < APPLY_STEPS.length - 1 ? (
                <span className={cn("mx-1 h-px w-4 shrink-0", done ? "bg-success" : "bg-border")} aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
