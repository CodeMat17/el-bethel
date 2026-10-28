import type { CmsKey } from "./schema";

/**
 * How each website document is laid out in the Site portal editor. The editor
 * is generic: it renders these field descriptions against the document's value.
 * Field names are paths into the value; the schema decides what is valid.
 */

export type CmsField =
  | { kind: "text"; name: string; label: string; help?: string; placeholder?: string; rows?: number }
  | { kind: "number"; name: string; label: string; help?: string }
  | { kind: "image"; name: string; label: string; help?: string }
  | { kind: "link"; name: string; label: string; help?: string }
  | { kind: "icon"; name: string; label: string }
  | { kind: "boolean"; name: string; label: string; help?: string }
  /** Class levels, chosen from the school's fixed list. */
  | { kind: "levels"; name: string; label: string; help?: string }
  | { kind: "strings"; name: string; label: string; help?: string; itemLabel: string; max: number; rows?: number }
  | {
      kind: "items";
      name: string;
      label: string;
      help?: string;
      itemLabel: string;
      max: number;
      /** Field of each item shown as its title in the list. */
      titleField: string;
      fields: CmsField[];
      blank: Record<string, unknown>;
      /** The list's length and order are fixed; only each item's fields can change. */
      fixed?: boolean;
    };

export interface CmsSection {
  /** Object in the value this section edits; omitted for top-level fields. */
  path?: string;
  title: string;
  description?: string;
  /** Section has a `visible` switch. */
  toggle?: boolean;
  fields: CmsField[];
}

export interface CmsDocumentSpec {
  key: CmsKey;
  title: string;
  description: string;
  icon: string;
  /** Public page to preview, or null when the document isn't a page. */
  previewPath: string;
  sections: CmsSection[];
}

const heading = (lede = true): CmsField[] => [
  { kind: "text", name: "eyebrow", label: "Small label above the title" },
  { kind: "text", name: "title", label: "Title" },
  ...(lede ? [{ kind: "text", name: "lede", label: "Introduction", rows: 2 } as CmsField] : []),
];

const identity: CmsDocumentSpec = {
  key: "identity",
  title: "Identity & contact",
  description: "The school's name, motto, current session, contact details and social links. Used in the header, footer and on every page.",
  icon: "School",
  previewPath: "/contact",
  sections: [
    {
      title: "School",
      fields: [
        { kind: "text", name: "name", label: "School name" },
        { kind: "text", name: "shortName", label: "Short name", help: "Shown in the header on phones." },
        { kind: "text", name: "type", label: "Type of school" },
        { kind: "text", name: "motto", label: "Motto" },
        { kind: "text", name: "session", label: "Current session", placeholder: "2026/2027", help: "Shown on admission banners. Change it once a year." },
        { kind: "text", name: "headteacher", label: "Headteacher's name" },
        { kind: "image", name: "logo", label: "Logo", help: "A square image works best. Leave empty to keep the current logo." },
      ],
    },
    {
      title: "Contact details",
      fields: [
        { kind: "text", name: "address", label: "Address", rows: 2 },
        { kind: "text", name: "city", label: "City" },
        { kind: "text", name: "state", label: "State" },
        { kind: "text", name: "phone", label: "Main phone", placeholder: "0812 390 8499" },
        { kind: "text", name: "phoneAlt", label: "Second phone", help: "Optional." },
        { kind: "text", name: "whatsapp", label: "WhatsApp number" },
        { kind: "text", name: "email", label: "Email" },
        { kind: "text", name: "admissionsEmail", label: "Admissions email" },
        { kind: "text", name: "officeHours", label: "Office hours", help: "Separate the days and the hours with a comma." },
      ],
    },
    {
      title: "Footer",
      fields: [{ kind: "text", name: "footerBlurb", label: "About the school (footer)", rows: 3 }],
    },
    {
      path: "social",
      title: "Social media",
      description: "Full links, starting with https://. Leave one empty to hide its icon.",
      fields: [
        { kind: "text", name: "facebook", label: "Facebook" },
        { kind: "text", name: "instagram", label: "Instagram" },
        { kind: "text", name: "youtube", label: "YouTube" },
        { kind: "text", name: "x", label: "X (Twitter)" },
      ],
    },
  ],
};

const home: CmsDocumentSpec = {
  key: "home",
  title: "Homepage",
  description: "Every section of the homepage, from the hero to the closing call to action.",
  icon: "House",
  previewPath: "/",
  sections: [
    {
      path: "hero",
      title: "Hero",
      description: "The first thing visitors see.",
      toggle: true,
      fields: [
        { kind: "text", name: "badge", label: "Badge above the headline" },
        { kind: "text", name: "headlineBefore", label: "Headline: start" },
        { kind: "text", name: "headlineHighlight", label: "Headline: highlighted word", help: "Shown in gold and underlined." },
        { kind: "text", name: "headlineAfter", label: "Headline: end" },
        { kind: "text", name: "text", label: "Text under the headline", rows: 3 },
        { kind: "link", name: "primary", label: "Main button" },
        { kind: "link", name: "secondary", label: "Second button" },
        { kind: "image", name: "image1", label: "Photo 1 (top left)" },
        { kind: "image", name: "image2", label: "Photo 2 (bottom left)" },
        { kind: "image", name: "image3", label: "Photo 3 (top right)" },
        { kind: "image", name: "image4", label: "Photo 4 (bottom right)" },
        { kind: "strings", name: "marquee", label: "Scrolling words", itemLabel: "Word", max: 16 },
      ],
    },
    {
      path: "intro",
      title: "Introduction",
      toggle: true,
      fields: [
        ...heading(false),
        { kind: "text", name: "lede", label: "Paragraph", rows: 4 },
        { kind: "strings", name: "points", label: "Ticked points", itemLabel: "Point", max: 8 },
        { kind: "image", name: "image", label: "Photo" },
        { kind: "link", name: "primary", label: "Main button" },
        { kind: "link", name: "secondary", label: "Second button" },
      ],
    },
    {
      path: "headteacher",
      title: "From the Headteacher",
      description: "The headteacher's name comes from Identity & contact.",
      toggle: true,
      fields: [
        { kind: "text", name: "eyebrow", label: "Small label" },
        { kind: "text", name: "quote", label: "Quote", rows: 3 },
        { kind: "text", name: "text", label: "Text under the quote", rows: 3 },
        { kind: "text", name: "role", label: "Title under the name" },
        { kind: "image", name: "image", label: "Portrait" },
        { kind: "link", name: "link", label: "Link to the full message" },
      ],
    },
    {
      path: "why",
      title: "Why El-Bethel",
      toggle: true,
      fields: [
        ...heading(),
        {
          kind: "items",
          name: "items",
          label: "Reasons",
          itemLabel: "Reason",
          max: 12,
          titleField: "title",
          blank: { icon: "Sparkles", title: "", text: "" },
          fields: [
            { kind: "icon", name: "icon", label: "Icon" },
            { kind: "text", name: "title", label: "Title" },
            { kind: "text", name: "text", label: "Text", rows: 2 },
          ],
        },
        { kind: "text", name: "cardTitle", label: "Last card: title" },
        { kind: "text", name: "cardText", label: "Last card: text", rows: 2 },
        { kind: "link", name: "cardLink", label: "Last card: button" },
      ],
    },
    {
      path: "programmes",
      title: "Academic programmes",
      description: "The programme cards come from the Academics page.",
      toggle: true,
      fields: [...heading(), { kind: "text", name: "buttonLabel", label: "Button" }],
    },
    {
      path: "stats",
      title: "Numbers",
      toggle: true,
      fields: [
        {
          kind: "items",
          name: "items",
          label: "Figures",
          itemLabel: "Figure",
          max: 8,
          titleField: "label",
          blank: { label: "", value: 0, suffix: "" },
          fields: [
            { kind: "text", name: "label", label: "Label" },
            { kind: "number", name: "value", label: "Number" },
            { kind: "text", name: "suffix", label: "After the number", help: "For example + or :1. Optional." },
          ],
        },
      ],
    },
    { path: "facilities", title: "Facilities", description: "The first six facilities from the School life page.", toggle: true, fields: heading() },
    { path: "clubs", title: "Clubs & activities", description: "Clubs are listed from the clubs collection.", toggle: true, fields: heading() },
    { path: "stars", title: "Our Stars", description: "The latest published achievements.", toggle: true, fields: heading() },
    { path: "teachers", title: "Teachers", description: "Teachers marked as featured.", toggle: true, fields: heading() },
    {
      path: "news",
      title: "News & events",
      toggle: true,
      fields: [
        { kind: "text", name: "newsEyebrow", label: "News: small label" },
        { kind: "text", name: "newsTitle", label: "News: title" },
        { kind: "text", name: "eventsEyebrow", label: "Events: small label" },
        { kind: "text", name: "eventsTitle", label: "Events: title" },
      ],
    },
    { path: "gallery", title: "Gallery", description: "The latest gallery photos.", toggle: true, fields: heading(false) },
    { path: "testimonials", title: "Parent voices", description: "Testimonials from the collection.", toggle: true, fields: heading(false) },
    { path: "values", title: "Core values", description: "The values come from the About page.", toggle: true, fields: heading(false) },
    {
      path: "contact",
      title: "Contact cards",
      description: "Address, phone and office hours come from Identity & contact.",
      toggle: true,
      fields: [
        { kind: "text", name: "visitTitle", label: "Address card title" },
        { kind: "text", name: "talkTitle", label: "Phone card title" },
        { kind: "text", name: "hoursTitle", label: "Office hours card title" },
      ],
    },
    {
      path: "cta",
      title: "Closing call to action",
      toggle: true,
      fields: [
        { kind: "text", name: "title", label: "Title" },
        { kind: "text", name: "text", label: "Text", rows: 2 },
        { kind: "link", name: "primary", label: "Main button" },
        { kind: "link", name: "secondary", label: "Second button" },
      ],
    },
  ],
};

/* ------------------------------ inner pages ------------------------------- */

const heroSection = (description?: string): CmsSection => ({
  path: "hero",
  title: "Page banner",
  description: description ?? "The title area at the top of the page.",
  fields: [
    { kind: "text", name: "eyebrow", label: "Small label" },
    { kind: "text", name: "title", label: "Title" },
    { kind: "text", name: "lede", label: "Introduction", rows: 3 },
  ],
});

const ctaSection: CmsSection = {
  path: "cta",
  title: "Closing call to action",
  toggle: true,
  fields: [
    { kind: "text", name: "title", label: "Title" },
    { kind: "text", name: "text", label: "Text", rows: 2 },
    { kind: "link", name: "primary", label: "Main button" },
    { kind: "link", name: "secondary", label: "Second button" },
  ],
};

const iconCards = (label: string, itemLabel: string, max = 12): CmsField => ({
  kind: "items",
  name: "items",
  label,
  itemLabel,
  max,
  titleField: "title",
  blank: { icon: "Sparkles", title: "", text: "" },
  fields: [
    { kind: "icon", name: "icon", label: "Icon" },
    { kind: "text", name: "title", label: "Title" },
    { kind: "text", name: "text", label: "Text", rows: 2 },
  ],
});

const titledCards = (label: string, itemLabel: string, max = 12): CmsField => ({
  kind: "items",
  name: "items",
  label,
  itemLabel,
  max,
  titleField: "title",
  blank: { title: "", text: "" },
  fields: [
    { kind: "text", name: "title", label: "Title" },
    { kind: "text", name: "text", label: "Text", rows: 3 },
  ],
});

const about: CmsDocumentSpec = {
  key: "about",
  title: "About: Our story",
  description: "History, milestones, vision and mission, core values, the anthem and accreditation.",
  icon: "BookMarked",
  previewPath: "/about",
  sections: [
    heroSection(),
    {
      path: "story",
      title: "Our story",
      toggle: true,
      fields: [
        ...heading(),
        { kind: "strings", name: "paragraphs", label: "Paragraphs", itemLabel: "Paragraph", max: 8, rows: 4 },
        { kind: "image", name: "image", label: "Photo" },
        { kind: "link", name: "primary", label: "Main button" },
        { kind: "link", name: "secondary", label: "Second button" },
      ],
    },
    {
      path: "timeline",
      title: "Milestones",
      toggle: true,
      fields: [
        ...heading(false),
        {
          kind: "items",
          name: "items",
          label: "Milestones",
          itemLabel: "Milestone",
          max: 16,
          titleField: "title",
          blank: { label: "", title: "", text: "" },
          fields: [
            { kind: "text", name: "label", label: "Small label", help: "For example a year." },
            { kind: "text", name: "title", label: "Title" },
            { kind: "text", name: "text", label: "Text", rows: 3 },
          ],
        },
      ],
    },
    {
      path: "vision",
      title: "Vision & mission",
      toggle: true,
      fields: [
        { kind: "text", name: "vision", label: "Vision", rows: 3 },
        { kind: "text", name: "mission", label: "Mission", rows: 3 },
      ],
    },
    {
      path: "stats",
      title: "Numbers",
      toggle: true,
      fields: [
        {
          kind: "items",
          name: "items",
          label: "Figures",
          itemLabel: "Figure",
          max: 8,
          titleField: "label",
          blank: { label: "", value: 0, suffix: "" },
          fields: [
            { kind: "text", name: "label", label: "Label" },
            { kind: "number", name: "value", label: "Number" },
            { kind: "text", name: "suffix", label: "After the number", help: "For example + or :1. Optional." },
          ],
        },
      ],
    },
    {
      path: "values",
      title: "Core values",
      description: "Also shown on the homepage.",
      toggle: true,
      fields: [...heading(), iconCards("Values", "Value")],
    },
    {
      path: "anthem",
      title: "School anthem",
      toggle: true,
      fields: [
        ...heading(),
        {
          kind: "items",
          name: "stanzas",
          label: "Verses",
          itemLabel: "Verse",
          max: 12,
          titleField: "label",
          blank: { label: "", chorus: false, lines: [] },
          fields: [
            { kind: "text", name: "label", label: "Label", placeholder: "Verse 1" },
            { kind: "boolean", name: "chorus", label: "This is the chorus", help: "Choruses are shown in a highlighted box." },
            { kind: "strings", name: "lines", label: "Lines", itemLabel: "Line", max: 12 },
          ],
        },
      ],
    },
    { path: "accreditations", title: "Accreditation", toggle: true, fields: [...heading(), titledCards("Accreditations", "Accreditation", 16)] },
    ctaSection,
  ],
};

const team: CmsDocumentSpec = {
  key: "team",
  title: "About: Our team",
  description: "The headteacher's message, leadership, school office and the teacher directory.",
  icon: "Users",
  previewPath: "/about/team",
  sections: [
    heroSection(),
    {
      path: "headteacher",
      title: "Headteacher's message",
      description: "The headteacher's name comes from Identity & contact.",
      toggle: true,
      fields: [
        { kind: "text", name: "eyebrow", label: "Small label" },
        { kind: "strings", name: "paragraphs", label: "Message", help: "The first paragraph is shown large.", itemLabel: "Paragraph", max: 10, rows: 4 },
        { kind: "image", name: "image", label: "Portrait" },
        { kind: "text", name: "signoff", label: "Under the name" },
      ],
    },
    { path: "leadership", title: "Leadership", description: "Leaders are the teachers in the Leadership department.", toggle: true, fields: heading(false) },
    {
      path: "office",
      title: "School office",
      toggle: true,
      fields: [
        { kind: "text", name: "title", label: "Title" },
        {
          kind: "items",
          name: "people",
          label: "Staff",
          itemLabel: "Person",
          max: 20,
          titleField: "name",
          blank: { name: "", role: "", remit: "" },
          fields: [
            { kind: "text", name: "name", label: "Name" },
            { kind: "text", name: "role", label: "Role" },
            { kind: "text", name: "remit", label: "What they look after", rows: 2 },
          ],
        },
      ],
    },
    { path: "teachers", title: "Teacher directory", description: "Teachers are listed from the school's staff records.", toggle: true, fields: heading() },
    ctaSection,
  ],
};

const academics: CmsDocumentSpec = {
  key: "academics",
  title: "Academics",
  description: "The five stages, what each class focuses on, subjects, assessment and teaching methods.",
  icon: "GraduationCap",
  previewPath: "/academics",
  sections: [
    heroSection(),
    {
      path: "stages",
      title: "Stages and classes",
      description: "Also shown on the homepage.",
      toggle: true,
      fields: [
        {
          kind: "items",
          name: "items",
          label: "Stages",
          itemLabel: "Stage",
          max: 5,
          fixed: true,
          titleField: "name",
          blank: {},
          fields: [
            { kind: "text", name: "name", label: "Name" },
            { kind: "text", name: "ages", label: "Ages" },
            { kind: "text", name: "text", label: "Description", rows: 3 },
            { kind: "image", name: "image", label: "Photo" },
          ],
        },
        {
          kind: "items",
          name: "levels",
          label: "What each class focuses on",
          itemLabel: "Class",
          max: 20,
          fixed: true,
          titleField: "name",
          blank: {},
          fields: [{ kind: "text", name: "focus", label: "Focus", rows: 2 }],
        },
      ],
    },
    {
      path: "subjects",
      title: "Subjects",
      description: "Subjects are listed from the school's records. Write {count} for the number of subjects.",
      toggle: true,
      fields: heading(false),
    },
    { path: "assessment", title: "Assessment", description: "The weighting shown comes from the academic policy.", toggle: true, fields: heading() },
    { path: "grading", title: "Grading", description: "The grade bands come from the academic policy.", toggle: true, fields: heading(false) },
    { path: "classes", title: "Class structure", toggle: true, fields: heading() },
    {
      path: "methods",
      title: "Teaching methods",
      toggle: true,
      fields: [...heading(false), { kind: "strings", name: "items", label: "Methods", itemLabel: "Method", max: 20 }],
    },
    ctaSection,
  ],
};

const admissions: CmsDocumentSpec = {
  key: "admissions",
  title: "Admissions",
  description: "The admissions page text: steps, requirements, fees notes and FAQs. Amounts and open classes are in Fees & admission rules.",
  icon: "FileCheck",
  previewPath: "/admissions",
  sections: [
    {
      path: "hero",
      title: "Page banner",
      fields: [
        { kind: "text", name: "eyebrow", label: "Small label" },
        { kind: "text", name: "title", label: "Title" },
        { kind: "text", name: "lede", label: "Introduction", rows: 3 },
        { kind: "link", name: "primary", label: "Main button" },
        { kind: "link", name: "secondary", label: "Second button" },
      ],
    },
    {
      path: "availability",
      title: "Which classes are open",
      description: "Open classes are chosen in Fees & admission rules.",
      toggle: true,
      fields: [...heading(), { kind: "text", name: "note", label: "Note under the list", rows: 2 }],
    },
    {
      path: "steps",
      title: "How it works",
      description: "Write {applicationFee} for the application fee.",
      toggle: true,
      fields: [...heading(false), iconCards("Steps", "Step", 10)],
    },
    { path: "requirements", title: "Requirements", description: "The document list is in Fees & admission rules.", toggle: true, fields: heading() },
    { path: "ages", title: "Age guide", toggle: true, fields: heading() },
    {
      path: "fees",
      title: "School fees",
      description: "The amounts are in Fees & admission rules.",
      toggle: true,
      fields: [
        ...heading(),
        { kind: "text", name: "admissionTitle", label: "Admission fees heading" },
        { kind: "text", name: "optionalTitle", label: "Optional services heading" },
        { ...titledCards("Payment notes", "Note", 8), name: "notes" },
      ],
    },
    { path: "faqs", title: "FAQs", description: "Questions and answers are edited under FAQs.", toggle: true, fields: heading(false) },
    ctaSection,
  ],
};

const amountItems = (name: string, label: string, itemLabel: string, max: number, help?: string): CmsField => ({
  kind: "items",
  name,
  label,
  help,
  itemLabel,
  max,
  titleField: "label",
  blank: { label: "", amount: 0 },
  fields: [
    { kind: "text", name: "label", label: "Item" },
    { kind: "number", name: "amount", label: "Amount (₦)" },
  ],
});

const fees: CmsDocumentSpec = {
  key: "fees",
  title: "Fees & admission rules",
  description: "Fee amounts, which classes are open for admission and which documents applicants must upload. The application form follows these once published.",
  icon: "Receipt",
  previewPath: "/admissions",
  sections: [
    {
      title: "Termly fees",
      description: "Each band covers one or more classes.",
      fields: [
        {
          kind: "items",
          name: "bands",
          label: "Fee bands",
          itemLabel: "Band",
          max: 10,
          titleField: "band",
          blank: { band: "", levelIds: [], lines: [{ label: "Tuition", amount: 0 }] },
          fields: [
            { kind: "text", name: "band", label: "Band name" },
            { kind: "levels", name: "levelIds", label: "Classes in this band" },
            amountItems("lines", "Charges per term", "Charge", 12),
          ],
        },
      ],
    },
    {
      title: "Admission fees",
      fields: [
        amountItems("admissionFees", "One-off fees", "Fee", 8, "The first fee is the application fee quoted on the application form."),
        amountItems("optionalFees", "Optional services", "Service", 12),
      ],
    },
    {
      title: "Admission rules",
      fields: [
        { kind: "levels", name: "openLevels", label: "Classes open for admission", help: "Families can only apply for these. The others show as waiting list." },
        {
          kind: "items",
          name: "documents",
          label: "Documents applicants upload",
          itemLabel: "Document",
          max: 7,
          fixed: true,
          titleField: "label",
          blank: {},
          fields: [
            { kind: "text", name: "label", label: "Name shown to families" },
            { kind: "boolean", name: "required", label: "Required", help: "Applications can't be submitted without it." },
          ],
        },
      ],
    },
  ],
};

const schoolLife: CmsDocumentSpec = {
  key: "schoolLife",
  title: "School life",
  description: "Clubs, sports and houses, the library, facilities, events and the gallery.",
  icon: "Puzzle",
  previewPath: "/school-life",
  sections: [
    heroSection(),
    { path: "clubs", title: "Clubs", description: "Clubs are edited under Clubs.", toggle: true, fields: heading() },
    {
      path: "sports",
      title: "Sports & houses",
      toggle: true,
      fields: [
        ...heading(false),
        iconCards("Sports", "Sport", 16),
        { kind: "text", name: "housesTitle", label: "Houses heading" },
        {
          kind: "items",
          name: "houses",
          label: "Houses",
          itemLabel: "House",
          max: 8,
          titleField: "name",
          blank: { name: "", motto: "" },
          fields: [
            { kind: "text", name: "name", label: "Name" },
            { kind: "text", name: "motto", label: "Motto" },
          ],
        },
      ],
    },
    { path: "library", title: "Library", toggle: true, fields: [...heading(), titledCards("Reading programme", "Item")] },
    {
      path: "facilities",
      title: "Facilities",
      description: "The first six are also shown on the homepage.",
      toggle: true,
      fields: [
        ...heading(false),
        {
          kind: "items",
          name: "items",
          label: "Facilities",
          itemLabel: "Facility",
          max: 30,
          titleField: "name",
          blank: { icon: "Building2", name: "", summary: "", description: "", image: null },
          fields: [
            { kind: "icon", name: "icon", label: "Icon" },
            { kind: "text", name: "name", label: "Name" },
            { kind: "text", name: "summary", label: "Short summary", help: "Shown on the homepage.", rows: 2 },
            { kind: "text", name: "description", label: "Description", rows: 3 },
            { kind: "image", name: "image", label: "Photo" },
          ],
        },
      ],
    },
    { path: "events", title: "Upcoming events", description: "Events are edited under Events.", toggle: true, fields: heading(false) },
    { path: "gallery", title: "Gallery", description: "Photos are edited under Gallery.", toggle: true, fields: heading(false) },
    ctaSection,
  ],
};

const alumni: CmsDocumentSpec = {
  key: "alumni",
  title: "Alumni",
  description: "Text around the alumni stories and reunions.",
  icon: "HandHeart",
  previewPath: "/alumni",
  sections: [
    heroSection(),
    {
      path: "stories",
      title: "Stories",
      fields: [...heading(false), { kind: "text", name: "empty", label: "Shown when there are no stories yet", rows: 2 }],
    },
    { path: "events", title: "Reunions", description: "Shown when there are alumni events.", fields: heading(false) },
    ctaSection,
  ],
};

const contact: CmsDocumentSpec = {
  key: "contact",
  title: "Contact",
  description: "The contact page. Address, phones and hours come from Identity & contact.",
  icon: "Phone",
  previewPath: "/contact",
  sections: [
    heroSection(),
    { title: "School office card", fields: [{ kind: "text", name: "officeTitle", label: "Title" }] },
    {
      path: "map",
      title: "Map card",
      toggle: true,
      fields: [
        { kind: "text", name: "place", label: "Place name" },
        { kind: "image", name: "image", label: "Background photo" },
      ],
    },
    {
      path: "apply",
      title: "Apply card",
      toggle: true,
      fields: [
        { kind: "text", name: "title", label: "Title" },
        { kind: "text", name: "text", label: "Text", rows: 2 },
        { kind: "link", name: "link", label: "Button" },
      ],
    },
    {
      path: "enquiry",
      title: "Enquiry form",
      fields: [
        { kind: "text", name: "title", label: "Title" },
        { kind: "text", name: "text", label: "Text", rows: 2 },
      ],
    },
    {
      path: "departments",
      title: "Departments",
      toggle: true,
      fields: [
        ...heading(false),
        {
          kind: "items",
          name: "items",
          label: "Departments",
          itemLabel: "Department",
          max: 12,
          titleField: "name",
          blank: { name: "", email: "", detail: "" },
          fields: [
            { kind: "text", name: "name", label: "Name" },
            { kind: "text", name: "email", label: "Email" },
            { kind: "text", name: "detail", label: "What they handle", rows: 2 },
          ],
        },
      ],
    },
  ],
};

const legal = (key: "privacy" | "terms", title: string, previewPath: string): CmsDocumentSpec => ({
  key,
  title,
  description: "A policy page. Update the date whenever the policy changes.",
  icon: "ScrollText",
  previewPath,
  sections: [
    {
      title: "Page",
      fields: [
        { kind: "text", name: "eyebrow", label: "Small label" },
        { kind: "text", name: "title", label: "Title" },
        { kind: "text", name: "lede", label: "Introduction", rows: 2 },
        { kind: "text", name: "updated", label: "Last updated", placeholder: "2 October 2026" },
      ],
    },
    {
      title: "Sections",
      fields: [
        {
          kind: "items",
          name: "sections",
          label: "Sections",
          itemLabel: "Section",
          max: 30,
          titleField: "heading",
          blank: { heading: "", paragraphs: [""], bullets: [] },
          fields: [
            { kind: "text", name: "heading", label: "Heading" },
            { kind: "strings", name: "paragraphs", label: "Paragraphs", itemLabel: "Paragraph", max: 12, rows: 3 },
            { kind: "strings", name: "bullets", label: "Bullet points", itemLabel: "Bullet point", max: 20, rows: 2 },
          ],
        },
      ],
    },
  ],
});

export const CMS_SPECS: Record<CmsKey, CmsDocumentSpec> = {
  identity,
  home,
  about,
  team,
  academics,
  admissions,
  fees,
  schoolLife,
  alumni,
  contact,
  privacy: legal("privacy", "Privacy & child protection", "/privacy"),
  terms: legal("terms", "Terms of use", "/terms"),
};

/** Pages in the order they appear on the dashboard and in the menu. */
export const CMS_PAGES: CmsKey[] = ["home", "about", "team", "academics", "admissions", "schoolLife", "alumni", "contact", "privacy", "terms"];

/** School-wide settings that aren't a single page. */
export const CMS_SETTINGS: CmsKey[] = ["identity", "fees"];
