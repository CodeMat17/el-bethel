import type { SchoolIdentity } from "./schema";

/**
 * Placeholders editors can type into any website text, filled from the school's
 * identity when the page renders — so a new session or headteacher only has to
 * be changed in one place.
 */
export const CMS_TOKENS: { token: string; label: string; pick: (s: SchoolIdentity) => string }[] = [
  { token: "{school}", label: "School name", pick: (s) => s.name },
  { token: "{session}", label: "Current session", pick: (s) => s.session },
  { token: "{motto}", label: "Motto", pick: (s) => s.motto },
  { token: "{city}", label: "City", pick: (s) => s.city },
  { token: "{headteacher}", label: "Headteacher", pick: (s) => s.headteacher },
  { token: "{email}", label: "School email", pick: (s) => s.email },
  { token: "{phone}", label: "Main phone", pick: (s) => s.phone },
  { token: "{address}", label: "Address", pick: (s) => s.address },
];

export function fillTokens<T>(value: T, school: SchoolIdentity): T {
  if (typeof value === "string") {
    let out: string = value;
    for (const t of CMS_TOKENS) out = out.split(t.token).join(t.pick(school));
    return out as T;
  }
  if (Array.isArray(value)) return value.map((item) => fillTokens(item, school)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // URLs and media references are never templated.
      out[k] = k === "href" || k === "url" || k === "publicId" ? v : fillTokens(v, school);
    }
    return out as T;
  }
  return value;
}

/** Nigerian numbers as written ("0812 390 8499") → international digits ("2348123908499"). */
export function intlDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/** The identity plus the derived links pages use. */
export function withLinks(school: SchoolIdentity) {
  return {
    ...school,
    phoneHref: school.phone ? `+${intlDigits(school.phone)}` : "",
    phoneAltHref: school.phoneAlt ? `+${intlDigits(school.phoneAlt)}` : "",
    whatsappHref: school.whatsapp ? `https://wa.me/${intlDigits(school.whatsapp)}` : "",
  };
}

export type School = ReturnType<typeof withLinks>;
