import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Small, dependency-free charts for the administration dashboard.
 *
 * Design rules applied throughout:
 * - One measure per chart, one axis. Never two y-scales.
 * - Magnitude is encoded with a single validated navy ramp (--viz-1…4), not a
 *   rainbow. A single series needs no legend — the heading names it.
 * - Every value is also written as text, so identity is never colour-alone.
 * - Marks are thin, data-ends are rounded and anchored to the baseline, grid and
 *   axis lines stay recessive.
 * - Hover gives a native tooltip through <title>, with no client JavaScript.
 */

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
}

/** Horizontal bars: comparing a magnitude across named categories. */
export function BarChart({
  data,
  unit = "",
  className,
  emphasise,
}: {
  data: BarDatum[];
  unit?: string;
  className?: string;
  emphasise?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className={cn("space-y-2.5", className)}>
      {data.map((datum) => {
        const pct = (datum.value / max) * 100;
        const highlighted = emphasise === datum.label;
        return (
          <li key={datum.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-semibold">{datum.label}</span>
              <span className="shrink-0 font-bold tabular-nums">
                {datum.value.toLocaleString("en-NG")}
                {unit}
              </span>
            </div>
            <div
              className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`${datum.label}: ${datum.value}${unit}`}
              title={datum.hint ?? `${datum.label}: ${datum.value}${unit}`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  highlighted ? "bg-viz-accent" : "bg-viz-3",
                )}
                style={{ width: `${Math.max(pct, 1.5)}%` }}
              />
            </div>
            {datum.hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{datum.hint}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Column chart for an ordinal scale (grade bands A–F). */
export function ColumnChart({
  data,
  className,
  caption,
}: {
  data: BarDatum[];
  className?: string;
  caption: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <figure className={cn("", className)}>
      <div className="flex h-44 items-end gap-2" role="img" aria-label={caption}>
        {data.map((datum) => {
          const pct = (datum.value / max) * 100;
          return (
            <div key={datum.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-bold tabular-nums text-muted-foreground">{datum.value}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-viz-3 transition-[height] duration-500"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                  title={`${datum.label}: ${datum.value}`}
                />
              </div>
              <span className="text-xs font-extrabold">{datum.label}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

export interface TrendPoint {
  label: string;
  value: number;
}

/** Single-series trend line with an area fill. Only the first and last are labelled. */
export function TrendChart({
  data,
  caption,
  suffix = "%",
  min = 0,
  max = 100,
  className,
}: {
  data: TrendPoint[];
  caption: string;
  suffix?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  if (data.length < 2) {
    return (
      <p className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        Not enough data to draw a trend yet.
      </p>
    );
  }

  const width = 640;
  const height = 180;
  const padX = 8;
  const padY = 16;
  const span = Math.max(1, max - min);

  const points = data.map((point, i) => {
    const x = padX + (i / (data.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (point.value - min) / span) * (height - padY * 2);
    return { ...point, x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${height - padY} L${points[0].x.toFixed(1)},${height - padY} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full"
        role="img"
        aria-label={caption}
        preserveAspectRatio="none"
      >
        <title>{caption}</title>
        {gridLines.map((fraction) => (
          <line
            key={fraction}
            x1={padX}
            x2={width - padX}
            y1={padY + fraction * (height - padY * 2)}
            y2={padY + fraction * (height - padY * 2)}
            stroke="var(--viz-grid)"
            strokeWidth={1}
          />
        ))}
        <path d={area} fill="var(--viz-3)" opacity={0.14} />
        <path d={line} fill="none" stroke="var(--viz-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="var(--viz-3)"
            stroke="var(--card)"
            strokeWidth={2}
          >
            <title>
              {point.label}: {point.value}
              {suffix}
            </title>
          </circle>
        ))}
        <circle cx={last.x} cy={last.y} r={5.5} fill="var(--viz-accent)" stroke="var(--card)" strokeWidth={2} />
      </svg>
      <div className="mt-2 flex items-baseline justify-between text-xs text-muted-foreground">
        <span>
          {first.label} · <span className="font-bold text-foreground">{first.value}{suffix}</span>
        </span>
        <span>
          {last.label} · <span className="font-bold text-foreground">{last.value}{suffix}</span>
        </span>
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

/** A single headline figure with an optional supporting split. */
export function HeroFigure({
  value,
  label,
  detail,
  progress,
  className,
}: {
  value: string;
  label: string;
  detail?: string;
  progress?: number;
  className?: string;
}) {
  return (
    <figure className={cn("", className)}>
      <p className="font-heading text-4xl leading-none font-extrabold tabular-nums sm:text-5xl">{value}</p>
      <figcaption className="mt-2 text-sm font-bold text-muted-foreground">{label}</figcaption>
      {typeof progress === "number" ? (
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-viz-accent transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
      {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
    </figure>
  );
}
