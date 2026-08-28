"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { avatarTone, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export interface SwitchableChild {
  id: string;
  name: string;
  className: string;
  avatarSeed: string;
}

export function ChildSwitcher({
  options,
  activeId,
}: {
  options: SwitchableChild[];
  activeId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (options.length <= 1) return null;

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("child", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const active = options.find((c) => c.id === activeId) ?? options[0];

  return (
    <Select value={active.id} onValueChange={(v) => onChange(String(v))}>
      <SelectTrigger className="h-10 w-[10.5rem] sm:w-56" aria-label="Switch child">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((child) => (
          <SelectItem key={child.id} value={child.id}>
            <span className="flex items-center gap-2.5">
              <Avatar className="size-6">
                <AvatarFallback className={cn("text-[0.6rem] font-bold", avatarTone(child.avatarSeed))}>
                  {initials(...child.name.split(" "))}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{child.name}</span>
                <span className="block truncate text-[0.65rem] text-muted-foreground">{child.className}</span>
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
