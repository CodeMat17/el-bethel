/** Award categories for "Our Stars" achievements and digital certificates. */
export const AWARD_CATEGORIES = [
  "Academic Excellence",
  "Sports",
  "Music",
  "Arts",
  "Competitions",
  "STEM",
  "Reading",
  "Leadership",
  "Community Service",
  "Attendance",
  "Special Recognition",
] as const;

export type AwardCategory = (typeof AWARD_CATEGORIES)[number];

/** Public certificate numbers: EIA-2026-00021. */
export const CERTIFICATE_PATTERN = /^EIA-\d{4}-\d{5}$/;

/** "David Chukwu" → "D. C." — what the public site and verification page show. */
export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.trim()[0]?.toUpperCase() ?? ""}. ${lastName.trim()[0]?.toUpperCase() ?? ""}.`;
}
