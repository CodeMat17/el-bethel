"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

import { cn } from "@/lib/utils";
import { dimensionsFor, photoFor } from "@/lib/school/photos";

/** Fade-and-rise on first view. Honours prefers-reduced-motion via the CSS override. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "section" | "article";
}) {
  const Component = { div: motion.div, li: motion.li, section: motion.section, article: motion.article }[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}

/** Counts up to `value` when scrolled into view. */
export function Counter({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1400, bounce: 0 });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  React.useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
      {suffix}
    </span>
  );
}

/** Strips `aspect-*` utilities (incl. breakpoint variants) so they cannot re-crop an image. */
function stripAspect(className?: string) {
  return className
    ?.split(/\s+/)
    .filter((c) => !/^(?:[a-z]+:)*aspect-/.test(c))
    .join(" ");
}

/** Decorative, brand-consistent stand-in for photography. No network requests. */
const TONE_CLASS: Record<string, string> = {
  navy: "from-navy via-navy to-[color-mix(in_oklch,var(--navy),var(--info)_35%)]",
  gold: "from-[color-mix(in_oklch,var(--gold),var(--navy)_15%)] via-gold to-[color-mix(in_oklch,var(--gold),var(--foreground)_10%)]",
  info: "from-info via-info to-[color-mix(in_oklch,var(--info),var(--navy)_45%)]",
  success: "from-success via-success to-[color-mix(in_oklch,var(--success),var(--navy)_45%)]",
  plum: "from-[oklch(0.42_0.11_310)] via-[oklch(0.48_0.12_305)] to-[oklch(0.36_0.09_300)]",
};

export function ToneImage({
  tone = "navy",
  seed = "cha",
  className,
  label,
  kind,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority,
}: {
  tone?: string;
  seed?: string;
  className?: string;
  label?: string;
  /** "portrait" draws from the staff portrait pool instead of the seed map. */
  kind?: "portrait";
  sizes?: string;
  priority?: boolean;
}) {
  const photo = photoFor(seed, kind);
  const dimensions = dimensionsFor(photo);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const angle = hash % 360;
  const cx = 20 + (hash % 60);
  const cy = 20 + ((hash >> 3) % 60);

  // The school's own photography is drawn at its natural aspect ratio: no wrapping
  // box, no fixed `aspect-*`, so the whole frame is visible and the image itself
  // takes up the space it is given.
  if (photo && dimensions) {
    return (
      <Image
        src={photo}
        alt={label ?? ""}
        width={dimensions.width}
        height={dimensions.height}
        sizes={sizes}
        priority={priority}
        className={cn("h-auto w-full", stripAspect(className))}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label ?? "Decorative school imagery"}
      className={cn(
        "relative overflow-hidden bg-linear-to-br",
        TONE_CLASS[tone] ?? TONE_CLASS.navy,
        className,
      )}
    >
      {photo ? (
        <Image src={photo} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
      ) : null}
      {photo ? null : (
      <svg className="absolute inset-0 size-full opacity-[0.22]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <radialGradient id={`g-${hash}`} cx={`${cx}%`} cy={`${cy}%`} r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.85" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#g-${hash})`} />
        <g transform={`rotate(${angle} 50 50)`} stroke="white" strokeOpacity="0.35" strokeWidth="0.6" fill="none">
          <circle cx="50" cy="50" r="18" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="42" />
          <path d="M-10 70 L110 30" />
          <path d="M-10 88 L110 48" />
        </g>
      </svg>
      )}
    </div>
  );
}
