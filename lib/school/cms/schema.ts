import { z } from "zod";

/**
 * Website content managed from the Site portal. Each document (the school's
 * identity, the homepage, …) is one JSON value validated by the schema below.
 * The same schemas run in Convex before anything is saved and on the website
 * before anything is rendered, so a malformed value can never reach a page.
 */

const text = (max = 300) => z.string().trim().max(max);
const longText = (max = 4000) => z.string().trim().max(max);

/** Links may point inside the site, to an anchor, or out over https, mail or phone. Never `javascript:`. */
export const cmsHref = z
  .string()
  .trim()
  .max(500)
  .regex(/^(\/|#|https:\/\/|http:\/\/|mailto:|tel:)/, "Links must start with /, #, https://, mailto: or tel:");

const optionalUrl = z.union([z.literal(""), z.string().trim().max(500).regex(/^https?:\/\//, "Use a full https:// address")]);

export const cmsLink = z.object({ label: text(60), href: cmsHref });

/** A Cloudinary photo, or null to use the built-in photography. */
export const cmsImage = z
  .object({
    publicId: z.string().max(300),
    url: z.string().max(1000).regex(/^https:\/\//),
    resourceType: z.enum(["image", "video"]),
    width: z.number().optional(),
    height: z.number().optional(),
    format: z.string().max(20).optional(),
    bytes: z.number().optional(),
  })
  .nullable();

const heading = { eyebrow: text(80), title: text(160), lede: text(400) };
const visible = { visible: z.boolean() };

/* -------------------------------- identity -------------------------------- */

export const identitySchema = z.object({
  name: text(120).min(2),
  shortName: text(20).min(2),
  type: text(160),
  motto: text(120),
  session: text(20),
  headteacher: text(80),
  address: text(300),
  city: text(60),
  state: text(80),
  phone: text(30),
  phoneAlt: text(30),
  whatsapp: text(30),
  email: z.string().trim().email().max(120),
  admissionsEmail: z.string().trim().email().max(120),
  officeHours: text(120),
  footerBlurb: text(400),
  logo: cmsImage,
  social: z.object({
    facebook: optionalUrl,
    instagram: optionalUrl,
    youtube: optionalUrl,
    x: optionalUrl,
  }),
});

/* -------------------------------- homepage -------------------------------- */

export const homeSchema = z.object({
  hero: z.object({
    ...visible,
    badge: text(80),
    headlineBefore: text(60),
    headlineHighlight: text(30),
    headlineAfter: text(60),
    text: text(400),
    primary: cmsLink,
    secondary: cmsLink,
    image1: cmsImage,
    image2: cmsImage,
    image3: cmsImage,
    image4: cmsImage,
    marquee: z.array(text(30)).max(16),
  }),
  intro: z.object({
    ...visible,
    ...heading,
    lede: longText(800),
    points: z.array(text(120)).max(8),
    image: cmsImage,
    primary: cmsLink,
    secondary: cmsLink,
  }),
  headteacher: z.object({
    ...visible,
    eyebrow: text(80),
    quote: longText(600),
    text: longText(800),
    role: text(60),
    image: cmsImage,
    link: cmsLink,
  }),
  why: z.object({
    ...visible,
    ...heading,
    items: z.array(z.object({ icon: text(40), title: text(80), text: text(300) })).max(12),
    cardTitle: text(80),
    cardText: text(300),
    cardLink: cmsLink,
  }),
  programmes: z.object({ ...visible, ...heading, buttonLabel: text(40) }),
  stats: z.object({
    ...visible,
    items: z.array(z.object({ label: text(40), value: z.number().min(0).max(1_000_000), suffix: text(6) })).max(8),
  }),
  facilities: z.object({ ...visible, ...heading }),
  clubs: z.object({ ...visible, ...heading }),
  stars: z.object({ ...visible, ...heading }),
  teachers: z.object({ ...visible, ...heading }),
  news: z.object({ ...visible, newsEyebrow: text(60), newsTitle: text(120), eventsEyebrow: text(60), eventsTitle: text(120) }),
  gallery: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  testimonials: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  values: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  contact: z.object({ ...visible, visitTitle: text(40), talkTitle: text(40), hoursTitle: text(40) }),
  cta: z.object({ ...visible, title: text(120), text: text(400), primary: cmsLink, secondary: cmsLink }),
});

/* ------------------------------ shared pieces ----------------------------- */

const pageHero = z.object({ eyebrow: text(80), title: text(160), lede: text(500) });
const ctaBand = z.object({ ...visible, title: text(120), text: text(400), primary: cmsLink, secondary: cmsLink });
const section = z.object({ ...visible, ...heading });
const block = <T extends z.ZodRawShape>(extra: T) => section.extend(extra);
const titled = z.object({ title: text(120), text: text(600) });
const iconCard = z.object({ icon: text(40), title: text(80), text: text(400) });
const amountLine = z.object({ label: text(80), amount: z.number().min(0).max(100_000_000) });
const levelIds = z.array(z.string().regex(/^lvl-[a-z0-9]+$/)).max(20);

/* ---------------------------------- about --------------------------------- */

export const aboutSchema = z.object({
  hero: pageHero,
  story: block({ lede: longText(600), paragraphs: z.array(longText(1500)).max(8), image: cmsImage, primary: cmsLink, secondary: cmsLink }),
  timeline: block({ items: z.array(z.object({ label: text(40), title: text(120), text: text(500) })).max(16) }),
  vision: z.object({ ...visible, vision: longText(800), mission: longText(800) }),
  stats: z.object({ ...visible, items: z.array(z.object({ label: text(40), value: z.number().min(0).max(1_000_000), suffix: text(6) })).max(8) }),
  values: block({ items: z.array(iconCard).max(12) }),
  anthem: block({ stanzas: z.array(z.object({ label: text(40), chorus: z.boolean(), lines: z.array(text(200)).max(12) })).max(12) }),
  accreditations: block({ items: z.array(titled).max(16) }),
  cta: ctaBand,
});

/* ---------------------------------- team ---------------------------------- */

export const teamSchema = z.object({
  hero: pageHero,
  headteacher: z.object({ ...visible, eyebrow: text(80), paragraphs: z.array(longText(1500)).max(10), image: cmsImage, signoff: text(160) }),
  leadership: section,
  office: z.object({ ...visible, title: text(120), people: z.array(z.object({ name: text(80), role: text(80), remit: text(300) })).max(20) }),
  teachers: section,
  cta: ctaBand,
});

/* -------------------------------- academics ------------------------------- */

export const STAGE_KEYS = ["early_years", "nursery", "lower_primary", "upper_primary", "junior_secondary"] as const;

export const academicsSchema = z.object({
  hero: pageHero,
  stages: z.object({
    ...visible,
    items: z.array(z.object({ key: z.enum(STAGE_KEYS), name: text(60), ages: text(40), text: text(500), image: cmsImage })).length(STAGE_KEYS.length),
    levels: z.array(z.object({ id: z.string().regex(/^lvl-[a-z0-9]+$/), name: text(40), focus: text(400) })).max(20),
  }),
  subjects: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  assessment: section,
  grading: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  classes: section,
  methods: z.object({ ...visible, eyebrow: text(80), title: text(160), items: z.array(text(80)).max(20) }),
  cta: ctaBand,
});

/* ------------------------------- admissions ------------------------------- */

export const admissionsSchema = z.object({
  hero: z.object({ eyebrow: text(80), title: text(160), lede: text(500), primary: cmsLink, secondary: cmsLink }),
  availability: block({ note: text(400) }),
  steps: z.object({ ...visible, eyebrow: text(80), title: text(160), items: z.array(iconCard).max(10) }),
  requirements: section,
  ages: section,
  fees: block({ admissionTitle: text(80), optionalTitle: text(80), notes: z.array(titled).max(8) }),
  faqs: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  cta: ctaBand,
});

export const DOCUMENT_KEYS = ["birth_certificate", "passport", "school_report", "transfer", "medical", "guardian_id", "other"] as const;

/** Fees and admission rules. Unlike page text, these are also enforced by the application form. */
export const feesSchema = z.object({
  bands: z.array(z.object({ band: text(80), levelIds, lines: z.array(amountLine).min(1).max(12) })).max(10),
  admissionFees: z.array(amountLine).min(1).max(8),
  optionalFees: z.array(amountLine).max(12),
  openLevels: levelIds,
  documents: z.array(z.object({ key: z.enum(DOCUMENT_KEYS), label: text(120), required: z.boolean() })).length(DOCUMENT_KEYS.length),
});

/* ------------------------------- school life ------------------------------ */

export const schoolLifeSchema = z.object({
  hero: pageHero,
  clubs: section,
  sports: z.object({
    ...visible,
    eyebrow: text(80),
    title: text(160),
    items: z.array(iconCard).max(16),
    housesTitle: text(120),
    houses: z.array(z.object({ name: text(40), motto: text(80) })).max(8),
  }),
  library: block({ items: z.array(titled).max(12) }),
  facilities: z.object({
    ...visible,
    eyebrow: text(80),
    title: text(160),
    items: z.array(z.object({ icon: text(40), name: text(80).min(1), summary: text(200), description: text(600), image: cmsImage })).max(30),
  }),
  events: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  gallery: z.object({ ...visible, eyebrow: text(80), title: text(160) }),
  cta: ctaBand,
});

/* --------------------------------- alumni --------------------------------- */

export const alumniSchema = z.object({
  hero: pageHero,
  stories: z.object({ eyebrow: text(80), title: text(160), empty: text(300) }),
  events: z.object({ eyebrow: text(80), title: text(160) }),
  cta: ctaBand,
});

/* --------------------------------- contact -------------------------------- */

export const contactSchema = z.object({
  hero: pageHero,
  officeTitle: text(80),
  map: z.object({ ...visible, place: text(80), image: cmsImage }),
  apply: z.object({ ...visible, title: text(80), text: text(300), link: cmsLink }),
  enquiry: z.object({ title: text(80), text: text(300) }),
  departments: z.object({
    ...visible,
    eyebrow: text(80),
    title: text(160),
    items: z.array(z.object({ name: text(60), email: z.string().trim().email().max(120), detail: text(200) })).max(12),
  }),
});

/* ---------------------------------- legal --------------------------------- */

export const legalSchema = z.object({
  eyebrow: text(80),
  title: text(160),
  lede: text(500),
  updated: text(40),
  sections: z.array(z.object({ heading: text(120), paragraphs: z.array(longText(2000)).max(12), bullets: z.array(text(600)).max(20) })).max(30),
});

/* --------------------------------- registry ------------------------------- */

export const CMS_SCHEMAS = {
  identity: identitySchema,
  home: homeSchema,
  about: aboutSchema,
  team: teamSchema,
  academics: academicsSchema,
  admissions: admissionsSchema,
  fees: feesSchema,
  schoolLife: schoolLifeSchema,
  alumni: alumniSchema,
  contact: contactSchema,
  privacy: legalSchema,
  terms: legalSchema,
} as const;

export type CmsKey = keyof typeof CMS_SCHEMAS;
export type CmsData = { [K in CmsKey]: z.infer<(typeof CMS_SCHEMAS)[K]> };
export type CmsImage = z.infer<typeof cmsImage>;
export type CmsLink = z.infer<typeof cmsLink>;
export type SchoolIdentity = CmsData["identity"];
export type HomeContent = CmsData["home"];
export type FeesContent = CmsData["fees"];
export type LegalContent = z.infer<typeof legalSchema>;

export const CMS_KEYS = Object.keys(CMS_SCHEMAS) as CmsKey[];

export function isCmsKey(key: string): key is CmsKey {
  return key in CMS_SCHEMAS;
}

/** Validate a value for a document; returns the first problem in plain words. */
export function validateCms<K extends CmsKey>(key: K, value: unknown): { ok: true; data: CmsData[K] } | { ok: false; message: string } {
  const parsed = CMS_SCHEMAS[key].safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data as CmsData[K] };
  const issue = parsed.error.issues[0];
  const where = issue?.path.length ? `${issue.path.join(" › ")}: ` : "";
  return { ok: false, message: `${where}${issue?.message ?? "Invalid content."}` };
}
