import { CORE_VALUES, HEADTEACHER_MESSAGE, SCHOOL, SCHOOL_STATS, WHY_EL_BETHEL } from "../config";
import * as pages from "./defaults-pages";
import type { CmsData, CmsKey, SchoolIdentity } from "./schema";

/**
 * The content the website shipped with. It is what a page shows until someone
 * publishes a change in the Site portal, and the starting point of each editor.
 */

const identity: SchoolIdentity = {
  name: SCHOOL.name,
  shortName: SCHOOL.shortName,
  type: SCHOOL.type,
  motto: SCHOOL.motto,
  session: SCHOOL.session,
  headteacher: SCHOOL.headteacher,
  address: SCHOOL.address,
  city: SCHOOL.city,
  state: SCHOOL.state,
  phone: SCHOOL.phone,
  phoneAlt: SCHOOL.phoneAlt,
  whatsapp: SCHOOL.whatsapp,
  email: SCHOOL.email,
  admissionsEmail: SCHOOL.admissionsEmail,
  officeHours: SCHOOL.officeHours,
  footerBlurb:
    "A private creche, nursery, primary and junior secondary school in Abuja providing quality, child-centred education in a safe, stimulating and technology-enabled environment.",
  logo: null,
  social: { ...SCHOOL.social },
};

const home: CmsData["home"] = {
  hero: {
    visible: true,
    badge: "{session} admission is open",
    headlineBefore: "Where Young Minds",
    headlineHighlight: "Discover",
    headlineAfter: "Their Possibilities",
    text: "At {school}, we nurture curious minds, build confident character and inspire children to learn, create and thrive.",
    primary: { label: "Apply for Admission", href: "/admissions/apply" },
    secondary: { label: "Explore Our School", href: "/about" },
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    marquee: CORE_VALUES.map((v) => v.name),
  },
  intro: {
    visible: true,
    eyebrow: "{motto}",
    title: "A school built entirely around how children actually learn",
    lede: "{school} is a private creche, nursery, primary and junior secondary school in {city}. We combine a strong academic foundation with creativity, technology, character development and sport because a child is never only a set of test scores.",
    points: [
      "Child-centred, activity-based teaching",
      "Continuous assessment, not one-off exams",
      "A digital classroom for every class",
      "Parents genuinely in the loop, every week",
    ],
    image: null,
    primary: { label: "Our story", href: "/about" },
    secondary: { label: "Admissions", href: "/admissions" },
  },
  headteacher: {
    visible: true,
    eyebrow: "From the Headteacher",
    quote: HEADTEACHER_MESSAGE[1],
    text: HEADTEACHER_MESSAGE[2],
    role: "Headteacher",
    image: null,
    link: { label: "Read the full message", href: "/about/team#headteacher" },
  },
  why: {
    visible: true,
    eyebrow: "Why El-Bethel",
    title: "Seven reasons families choose us",
    lede: "Every one of these is a promise we are measured against, term after term.",
    items: WHY_EL_BETHEL.map((w) => ({ icon: w.icon, title: w.title, text: w.text })),
    cardTitle: "Have a question?",
    cardText: "Our school office answers enquiries within one working day, Monday to Friday.",
    cardLink: { label: "Contact us", href: "/contact" },
  },
  programmes: {
    visible: true,
    eyebrow: "Academic Programmes",
    title: "From first steps to secondary-ready",
    lede: "Fourteen class levels from creche to JSS 3, each with its own curriculum, assessment rhythm and pastoral care.",
    buttonLabel: "All academics",
  },
  stats: {
    visible: true,
    items: SCHOOL_STATS.map((s) => ({ label: s.label, value: s.value, suffix: s.suffix })),
  },
  facilities: {
    visible: true,
    eyebrow: "Facilities",
    title: "Spaces designed around small people",
    lede: "Thirteen dedicated spaces, from a child-safe science laboratory to a soft-surface playground.",
  },
  clubs: {
    visible: true,
    eyebrow: "Clubs & Activities",
    title: "Sixteen ways to find what you love",
    lede: "Every pupil joins at least one club. Some find a hobby; a few find a calling.",
  },
  stars: {
    visible: true,
    eyebrow: "Our Stars",
    title: "Pupil achievements worth celebrating",
    lede: "We share what our children accomplish — and we protect their privacy while doing it.",
  },
  teachers: {
    visible: true,
    eyebrow: "Our Teachers",
    title: "The people who will know your child by name",
    lede: "Forty-two teaching staff, trained in the academic, emotional and developmental needs of children.",
  },
  news: {
    visible: true,
    newsEyebrow: "Latest News",
    newsTitle: "What's happening at El-Bethel",
    eventsEyebrow: "Upcoming",
    eventsTitle: "School events",
  },
  gallery: { visible: true, eyebrow: "Gallery", title: "A term in pictures" },
  testimonials: { visible: true, eyebrow: "Parent Voices", title: "What families say" },
  values: { visible: true, eyebrow: "Core Values", title: "Seven values, taught and lived" },
  contact: { visible: true, visitTitle: "Visit us", talkTitle: "Talk to us", hoursTitle: "Office hours" },
  cta: {
    visible: true,
    title: "Ready to join the El-Bethel family?",
    text: "Admission for the {session} session is open for every class — Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3. Spaces in some classes are limited.",
    primary: { label: "Apply for admission", href: "/admissions/apply" },
    secondary: { label: "Contact the school", href: "/contact" },
  },
};

export const CMS_DEFAULTS: CmsData = {
  identity,
  home,
  about: pages.about,
  team: pages.team,
  academics: pages.academics,
  admissions: pages.admissions,
  fees: pages.fees,
  schoolLife: pages.schoolLife,
  alumni: pages.alumni,
  contact: pages.contact,
  privacy: pages.privacy,
  terms: pages.terms,
};

/**
 * Fill gaps in a stored document from the defaults, one level deep, so a field
 * added to a schema later shows its default instead of failing validation.
 */
export function withDefaults<K extends CmsKey>(key: K, stored: unknown): unknown {
  const base = CMS_DEFAULTS[key] as Record<string, unknown>;
  if (!stored || typeof stored !== "object") return base;
  const merged: Record<string, unknown> = { ...base };
  for (const [field, value] of Object.entries(stored as Record<string, unknown>)) {
    const fallback = base[field];
    merged[field] =
      fallback && typeof fallback === "object" && !Array.isArray(fallback) && value && typeof value === "object" && !Array.isArray(value)
        ? { ...fallback, ...value }
        : value;
  }
  return merged;
}
