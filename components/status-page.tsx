import Link from "next/link";

import { Brand } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export function StatusPage({
  code,
  icon = "Shield",
  title,
  description,
  actions,
}: {
  code?: string;
  icon?: string;
  title: string;
  description: string;
  actions: { label: string; href: string; variant?: "default" | "outline" }[];
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Brand className="mb-10" />
      <span className="grid size-16 place-items-center rounded-3xl bg-gold/12 text-gold-foreground ring-1 ring-gold/25 dark:text-gold">
        <Icon name={icon} className="size-7" />
      </span>
      {code ? (
        <p className="mt-6 text-[0.68rem] font-extrabold tracking-[0.2em] text-muted-foreground uppercase">
          Error {code}
        </p>
      ) : null}
      <h1 className="mt-3 max-w-xl text-balance font-heading text-2xl sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {actions.map((action) => (
          <Button
            key={action.href}
            size="lg"
            variant={action.variant ?? "default"}
            className="h-11 font-bold"
            render={<Link href={action.href} />}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
