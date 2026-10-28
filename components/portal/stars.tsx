
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface StarsData {
  house: string;
  points: number;
  level: { name: string; number: number; nextName: string | null; nextAt: number | null; progress: number };
  breakdown: { key: string; label: string; icon: string; points: number }[];
  badges: { key: string; label: string; description: string; icon: string; current: number; target: number; earned: boolean }[];
  streak: number;
  bestStreak: number;
  houses: { house: string; points: number; pupils: number; computedAt: string | null }[];
}

const HOUSE_COLOUR: Record<string, string> = {
  Emerald: "bg-emerald-600",
  Sapphire: "bg-blue-600",
  Ruby: "bg-rose-600",
  Amber: "bg-amber-500",
};

/** Level and points at a glance. */
export function StarsSummary({ data, compact = false }: { data: StarsData; compact?: boolean }) {
  return (
    <Card className={cn("gap-0 border-gold/30 bg-gold/8", compact ? "p-4" : "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Level {data.level.number}</p>
          <p className="font-heading text-2xl font-extrabold">{data.level.name}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-3xl font-extrabold tabular-nums">{data.points}</p>
          <p className="text-xs font-bold text-muted-foreground">stars</p>
        </div>
      </div>
      {data.level.nextAt !== null ? (
        <div className="mt-4">
          <Progress value={data.level.progress} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {data.level.nextAt - data.points} more stars to reach {data.level.nextName}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm font-bold">Top level reached — amazing!</p>
      )}
    </Card>
  );
}

export function HouseTable({ houses, mine }: { houses: StarsData["houses"]; mine: string }) {
  const top = Math.max(1, ...houses.map((h) => h.points));
  return (
    <ol className="space-y-3">
      {houses.map((h, i) => (
        <li key={h.house}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className={cn("font-bold", h.house === mine && "underline decoration-gold decoration-2 underline-offset-4")}>
              {i + 1}. {h.house}
            </span>
            <span className="font-bold tabular-nums">{h.points.toLocaleString()}</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", HOUSE_COLOUR[h.house] ?? "bg-primary")} style={{ width: `${Math.round((h.points / top) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
