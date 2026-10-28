import {
  ADMISSION_FEES,
  ADMISSION_OPEN_LEVELS,
  APPLICATION_DOCUMENT_REQUIREMENTS,
  CLASS_LEVELS,
  CORE_VALUES,
  FACILITIES,
  FEE_STRUCTURE,
  HEADTEACHER_MESSAGE,
  MISSION,
  OPTIONAL_FEES,
  SCHOOL_ANTHEM,
  SCHOOL_STATS,
  STAGES,
  TEACHING_METHODS,
  VISION,
} from "../config";
import type { CmsData } from "./schema";

/** Starting content for the inner pages — what each page showed before the Site portal existed. */

const defaultCta = {
  visible: true,
  title: "Ready to join the El-Bethel family?",
  text: "Admission for the {session} session is open for every class — Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3. Spaces in some classes are limited.",
  primary: { label: "Apply for admission", href: "/admissions/apply" },
  secondary: { label: "Contact the school", href: "/contact" },
};

export const about: CmsData["about"] = {
  hero: {
    eyebrow: "About us",
    title: "A school built around how children actually learn",
    lede: "Based in Ushafa, Abuja, {school} has grown from two classrooms into a community of 688 pupils — without ever losing sight of the individual child.",
  },
  story: {
    visible: true,
    eyebrow: "Our story",
    title: "It started with a question",
    lede: "Why should a child have to choose between a school that is academically serious and one that is genuinely kind?",
    paragraphs: [
      "A small group of Abuja educators and parents opened El-Bethel International Academy with thirty-one pupils. The premise was simple: children learn best when they feel safe, valued and challenged — in that order.",
      "That premise has not changed, but the school around it has. We now teach fourteen class levels across twenty-nine classes — creche, pre-school, nursery, primary and junior secondary — with a science laboratory, an ICT and innovation lab, a library, a creative arts studio and full sporting facilities.",
      "What has stayed constant is the relationship at the centre of it all: a class teacher who knows your child, and a school that keeps you genuinely informed about how they are doing.",
    ],
    image: null,
    primary: { label: "Headteacher's message", href: "/about/team#headteacher" },
    secondary: { label: "Meet our teachers", href: "/about/team" },
  },
  timeline: {
    visible: true,
    eyebrow: "Milestones",
    title: "Our journey, told in six moments",
    lede: "",
    items: [
      { label: "The beginning", title: "Two classrooms in Ushafa", text: "El-Bethel International opened with 31 pupils, four teachers and a conviction that primary education in Abuja could be warmer and more rigorous at the same time." },
      { label: "First graduates", title: "First Primary 6 cohort", text: "Our first cohort completed Primary 6 and moved on to secondary schools across Abuja and beyond." },
      { label: "Innovation", title: "ICT & Innovation Lab", text: "We opened a dedicated lab and introduced coding and robotics from Primary 3 upwards." },
      { label: "Going digital", title: "Digital classrooms", text: "Every class gained a digital classroom, giving parents visibility of assignments and results." },
      { label: "Growth", title: "Campus expansion", text: "New science laboratory, expanded library and a refurbished creative arts studio." },
      { label: "Today", title: "688 pupils, 58 teachers", text: "Twenty-nine classes from creche to JSS 3, with a pupil-to-teacher ratio of twelve to one." },
    ],
  },
  vision: { visible: true, vision: VISION, mission: MISSION },
  stats: { visible: true, items: SCHOOL_STATS.slice(0, 4).map((s) => ({ label: s.label, value: s.value, suffix: s.suffix })) },
  values: {
    visible: true,
    eyebrow: "Core values",
    title: "Seven values we teach, model and expect",
    lede: "These are not posters on a wall. They appear in our conduct ratings on every report card.",
    items: CORE_VALUES.map((v) => ({ icon: v.icon, title: v.name, text: v.text })),
  },
  anthem: {
    visible: true,
    eyebrow: "School anthem",
    title: "Sung at assembly every morning",
    lede: "The anthem carries our motto — knowledge and the fear of God — into every school day.",
    stanzas: SCHOOL_ANTHEM.map((s) => ({ label: s.label, chorus: s.kind === "chorus", lines: [...s.lines] })),
  },
  accreditations: {
    visible: true,
    eyebrow: "Accreditation",
    title: "Registered, approved and inspected",
    lede: "Every certificate below is available for inspection at the school office on request.",
    items: [
      { title: "FCT Universal Basic Education Board", text: "Registered private creche, nursery, primary and junior secondary school." },
      { title: "Federal Ministry of Education", text: "Approved to deliver the Nigerian national curriculum." },
      { title: "National Association of Proprietors of Private Schools", text: "Member in good standing, FCT chapter." },
      { title: "Child Safeguarding Standards", text: "Annual independent safeguarding and child protection review." },
      { title: "Fire & Building Safety Certification", text: "Campus inspected and certified annually by the FCT fire service." },
      { title: "Food Handling & Hygiene Permit", text: "Cafeteria licensed and inspected by the FCT public health authority." },
    ],
  },
  cta: defaultCta,
};

export const team: CmsData["team"] = {
  hero: { eyebrow: "About us", title: "Our Team", lede: "The Headteacher, leadership, office staff and teachers who will know your child by name." },
  headteacher: {
    visible: true,
    eyebrow: "Headteacher's message",
    paragraphs: [...HEADTEACHER_MESSAGE],
    image: null,
    signoff: "Headteacher, {school}",
  },
  leadership: { visible: true, eyebrow: "Leadership", title: "Setting and holding the standard", lede: "" },
  office: {
    visible: true,
    title: "School office",
    people: [
      { name: "Ngozi Adeleke", role: "School Administrator", remit: "Operations, admissions oversight, staffing and compliance." },
      { name: "Mr. Bola Ogunleye", role: "Accountant", remit: "Fees, invoicing, payment verification and financial reporting." },
      { name: "Mrs. Halima Sani", role: "Admissions Officer", remit: "Applications, assessments, interviews and enrolment." },
      { name: "Mr. Uche Nnaji", role: "Librarian", remit: "Catalogue, borrowing, reading programme and study support." },
      { name: "Mrs. Rita Eneh", role: "School Nurse", remit: "Medical centre, health records, screening and first aid." },
    ],
  },
  teachers: { visible: true, eyebrow: "Our teachers", title: "Find a teacher", lede: "Search by name, role or subject, or filter by department." },
  cta: {
    visible: true,
    title: "Want to talk to a teacher?",
    text: "Contact the school office and we will put you in touch with the right class teacher or head of section.",
    primary: { label: "Contact the school", href: "/contact" },
    secondary: { label: "Apply for admission", href: "/admissions/apply" },
  },
};

const YEAR_FOCUS: Record<string, string> = {
  "lvl-cre": "Settling, secure attachment, sensory play, first words and a predictable daily rhythm.",
  "lvl-pre": "Talking in short sentences, colours and shapes, sharing and turn-taking, toilet independence.",
  "lvl-n1": "Letter sounds, number recognition to 20, holding a pencil correctly, my body and my family.",
  "lvl-n2": "Blending simple words, writing numerals to 50, plants and animals, first computer play.",
  "lvl-n3": "Reading three-letter words and first sentences, numbers to 100, full Primary 1 readiness.",
  "lvl-p1": "Reading fluency, number bonds to 20, structured routines and independence.",
  "lvl-p2": "Extended writing, times tables to 5, first science investigations.",
  "lvl-p3": "Comprehension strategies, multiplication and division, coding begins.",
  "lvl-p4": "Fractions and decimals, laboratory practicals, robotics, longer projects.",
  "lvl-p5": "Reasoning under time, research skills, leadership roles across the school.",
  "lvl-p6": "Secondary-school readiness: study skills, revision technique and transition support.",
  "lvl-j1": "Settling into subject teaching, study routines, note-making and the full junior syllabus foundation.",
  "lvl-j2": "Algebra, laboratory technique, extended writing and the first internal mock examinations.",
  "lvl-j3": "BECE preparation, past-question practice, subject-choice counselling and senior secondary guidance.",
};

export const academics: CmsData["academics"] = {
  hero: {
    eyebrow: "Academics",
    title: "A curriculum children can actually use",
    lede: "Fourteen class levels from creche to JSS 3, thirty subjects and an assessment rhythm designed to catch a struggling child in week three — not at the end of term.",
  },
  stages: {
    visible: true,
    items: STAGES.map((s) => ({ key: s.key, name: s.name, ages: s.ages, text: s.text, image: null })),
    levels: CLASS_LEVELS.map((l) => ({ id: l.id, name: l.name, focus: YEAR_FOCUS[l.id] ?? "" })),
  },
  subjects: { visible: true, eyebrow: "Subjects", title: "{count} subjects across the school" },
  assessment: {
    visible: true,
    eyebrow: "Assessment",
    title: "How a term score is built",
    lede: "Every subject score is out of 100, split between continuous assessment and the examination. The usual split is 40/60; each subject teacher sets the exact weighting for the term.",
  },
  grading: { visible: true, eyebrow: "Grading", title: "Grade bands and remarks" },
  classes: {
    visible: true,
    eyebrow: "Class structure",
    title: "Twenty-nine classes across fourteen levels",
    lede: "Sections are kept deliberately small. Our average class size is 24 pupils.",
  },
  methods: { visible: true, eyebrow: "Teaching methods", title: "Eleven ways we teach", items: [...TEACHING_METHODS] },
  cta: defaultCta,
};

export const admissions: CmsData["admissions"] = {
  hero: {
    eyebrow: "{session} admission",
    title: "Admission is open",
    lede: "Admission is open for every class — Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3 — for the {session} session. Limited spaces are available in some classes.",
    primary: { label: "Apply online", href: "/admissions/apply" },
    secondary: { label: "View school fees", href: "/admissions#fees" },
  },
  availability: {
    visible: true,
    eyebrow: "Availability",
    title: "Which classes are open",
    lede: "Availability changes as places are filled. The classes below reflect today's position.",
    note: "Limited spaces are available in some classes. Applications are considered in the order they are completed.",
  },
  steps: {
    visible: true,
    eyebrow: "How it works",
    title: "Six steps from enquiry to enrolment",
    items: [
      { title: "Create an account", text: "One account, used for your application and later for the Parent Portal.", icon: "UserRound" },
      { title: "Complete the form", text: "Pupil details, parent details and your intended class. Saved as you go.", icon: "PenLine" },
      { title: "Prepare your documents", text: "Bring the birth certificate, passport photograph, medical information and identification to screening.", icon: "FileCheck" },
      { title: "Pay the application fee", text: "{applicationFee}, paid at the school bursary or by bank transfer.", icon: "CreditCard" },
      { title: "Submit and track", text: "Receive your application number and follow every update in one place.", icon: "Search" },
      { title: "Assessment and decision", text: "Age-appropriate assessment, a short family conversation, then a decision.", icon: "BadgeCheck" },
    ],
  },
  requirements: {
    visible: true,
    eyebrow: "Requirements",
    title: "What you will need",
    lede: "Photographs of original documents are accepted, provided every corner is visible. JPG, PNG, WEBP, PDF and DOCX files up to 5 MB each.",
  },
  ages: {
    visible: true,
    eyebrow: "Age guide",
    title: "Typical entry ages",
    lede: "Age on 1 September of the year of entry. We consider readiness alongside age.",
  },
  fees: {
    visible: true,
    eyebrow: "School fees",
    title: "What a term costs, by class band",
    lede: "Published in full, per term, with no hidden extras.",
    admissionTitle: "One-off admission fees",
    optionalTitle: "Optional services",
    notes: [
      { title: "When fees are due", text: "Termly invoices are issued two weeks before resumption and are due by the end of the second week of term." },
      { title: "Payment methods", text: "Pay at the school bursary or by bank transfer, quoting your invoice number. There is no online payment. Receipts are issued once the bursar confirms a payment." },
      { title: "Instalment plans", text: "Available on request. Contact the school accountant before the start of term to agree a schedule." },
      { title: "Sibling consideration", text: "Families with three or more children enrolled receive a discount on the third and subsequent child. Contact the office for details." },
    ],
  },
  faqs: { visible: true, eyebrow: "Questions", title: "Frequently asked questions" },
  cta: defaultCta,
};

export const fees: CmsData["fees"] = {
  bands: FEE_STRUCTURE.map((b) => ({ band: b.band, levelIds: [...b.levelIds], lines: b.lines.map((l) => ({ label: l.label, amount: l.amount })) })),
  admissionFees: ADMISSION_FEES.map((f) => ({ label: f.label, amount: f.amount })),
  optionalFees: OPTIONAL_FEES.map((f) => ({ label: f.label, amount: f.amount })),
  openLevels: [...ADMISSION_OPEN_LEVELS],
  documents: APPLICATION_DOCUMENT_REQUIREMENTS.map((d) => ({ key: d.key as CmsData["fees"]["documents"][number]["key"], label: d.label, required: d.required })),
};

export const schoolLife: CmsData["schoolLife"] = {
  hero: {
    eyebrow: "School life",
    title: "What happens between the lessons",
    lede: "Clubs, sport, reading, excursions, competitions and four fiercely competitive houses. This is where a lot of the learning actually sticks.",
  },
  clubs: { visible: true, eyebrow: "Clubs", title: "Find what you love", lede: "Clubs run after lessons and are included in your child's activities fee." },
  sports: {
    visible: true,
    eyebrow: "Sports",
    title: "Six sports across the school",
    items: [
      { title: "Football", icon: "Goal", text: "Coached academy sessions twice a week, plus inter-house and inter-school fixtures." },
      { title: "Basketball", icon: "CircleDot", text: "Adjustable hoops sized for primary pupils, with coached sessions after school." },
      { title: "Volleyball", icon: "Volleyball", text: "Introduced in upper primary, with a dedicated sand and hard-court area." },
      { title: "Athletics", icon: "Timer", text: "Sprints, relays, long jump and field events, building to the annual sports festival." },
      { title: "Physical Education", icon: "Trophy", text: "Timetabled PE for every class every week, taught by a specialist teacher." },
      { title: "Dance & Movement", icon: "Palette", text: "Traditional and contemporary dance, performed at cultural day and prize-giving." },
    ],
    housesTitle: "Four houses, one very loud sports day",
    houses: [
      { name: "Emerald", motto: "Steady and strong" },
      { name: "Sapphire", motto: "Bold and bright" },
      { name: "Ruby", motto: "Fearless together" },
      { name: "Amber", motto: "Warm and relentless" },
    ],
  },
  library: {
    visible: true,
    eyebrow: "Library",
    title: "How reading works here",
    lede: "Reading is the single best predictor of later success, so it runs through every week.",
    items: [
      { title: "Guided reading", text: "Small-group reading with a teacher, matched to each child's current level, twice a week." },
      { title: "Reading challenge", text: "Twenty books a term earns a place at our celebration assembly. Every pupil gets a reading passport." },
      { title: "Story sessions", text: "Weekly story time for lower primary, often with a guest reader." },
      { title: "Borrowing", text: "Pupils from Primary 1 may borrow one book at a time for two weeks, renewable once." },
    ],
  },
  facilities: {
    visible: true,
    eyebrow: "Facilities",
    title: "Where it all happens",
    items: FACILITIES.map((f) => ({ icon: f.icon, name: f.name, summary: f.summary, description: f.description, image: null })),
  },
  events: { visible: true, eyebrow: "Upcoming", title: "What's coming up" },
  gallery: { visible: true, eyebrow: "Gallery", title: "A term in pictures" },
  cta: defaultCta,
};

export const alumni: CmsData["alumni"] = {
  hero: {
    eyebrow: "Alumni",
    title: "Once El-Bethel, always El-Bethel",
    lede: "Where our former pupils have gone, in their own words — and when to come back and see us.",
  },
  stories: { eyebrow: "Stories", title: "Where are they now?", empty: "Alumni stories are coming soon. Have one to share? Contact the school office." },
  events: { eyebrow: "Reunions", title: "Alumni events" },
  cta: {
    visible: true,
    title: "Are you a former El-Bethel pupil?",
    text: "We love hearing where our pupils have gone. Get in touch with the school office to share your story.",
    primary: { label: "Contact the school", href: "/contact" },
    secondary: { label: "Visit our news", href: "/news" },
  },
};

export const contact: CmsData["contact"] = {
  hero: { eyebrow: "Contact", title: "Talk to us", lede: "We answer enquiries within one working day. For anything urgent, please call the school office." },
  officeTitle: "School office",
  map: { visible: true, place: "Ushafa, Abuja", image: null },
  apply: {
    visible: true,
    title: "Ready to apply?",
    text: "Admission is open for the {session} session. Start an application online and save it as you go.",
    link: { label: "Apply for admission", href: "/admissions/apply" },
  },
  enquiry: { title: "Send us an enquiry", text: "Tell us what you need and the right person will come back to you." },
  departments: {
    visible: true,
    eyebrow: "Departments",
    title: "Contact the right team directly",
    items: [
      { name: "Admissions", email: "info@ebia.com.ng", detail: "Applications, assessments and enrolment." },
      { name: "Accounts", email: "info@ebia.com.ng", detail: "Invoices, payments, receipts and payment plans." },
      { name: "Academics", email: "info@ebia.com.ng", detail: "Curriculum, results, report cards and learning support." },
    ],
  },
};

export const privacy: CmsData["privacy"] = {
  eyebrow: "Policies",
  title: "Privacy & Child Protection",
  lede: "This platform holds children's educational records and family financial information. Here is exactly how we treat it.",
  updated: "20 August 2026",
  sections: [
    {
      heading: "Our commitment",
      paragraphs: [
        "{school} processes personal information about children, their families and our staff. We treat that as a duty of care first and a compliance obligation second.",
        "We collect only what we need to educate and safeguard a child, we keep it only as long as we need it, and we never sell it or share it for marketing.",
      ],
      bullets: [],
    },
    {
      heading: "What we collect",
      paragraphs: ["The information we hold falls into a small number of categories."],
      bullets: [
        "Pupil records: name, date of birth, gender, nationality, address, photograph, class, admission number and academic history.",
        "Health information: blood group, allergies, immunisation and any condition our school nurse must know about.",
        "Family records: parent and guardian names, contact details, occupation, emergency contacts and the parent–child relationship.",
        "Academic records: assignments, submissions, assessment scores, results, report cards and conduct ratings.",
        "Financial records: invoices, payments, receipts and outstanding balances.",
        "Application records: everything supplied during an admission application, including uploaded documents.",
        "Technical records: sign-in times, audit logs of administrative actions, and device information where needed for security.",
      ],
    },
    {
      heading: "How we use it",
      paragraphs: [
        "We use personal information to educate and care for pupils, to communicate with families, to manage admissions and fees, and to meet our legal and regulatory obligations as a registered school.",
        "We do not use children's information to profile them commercially, and we do not allow third-party advertising or analytics that track children on this platform.",
      ],
      bullets: [],
    },
    {
      heading: "Who can see what",
      paragraphs: ["Access is controlled by role and enforced on the server on every request, not in the browser."],
      bullets: [
        "Parents see only their own children — never another family's records.",
        "Pupils see only their own work and results.",
        "Teachers see only pupils in classes they teach, and only the data relevant to teaching them.",
        "Accountants see financial records but not academic detail.",
        "Administrators have broad access, and every sensitive action they take is written to an audit log they cannot edit.",
      ],
    },
    {
      heading: "Children's images",
      paragraphs: [
        "We publish photographs of children only where a parent or guardian has given consent, and we record that consent against each image.",
        "On the public website we never publish a child's full name alongside their photograph, their class section, or any contact information. Pupil achievements are published using initials and year group only.",
        "Consent can be withdrawn at any time by contacting the school office, and we will remove the affected images.",
      ],
      bullets: [],
    },
    {
      heading: "How we protect it",
      paragraphs: ["Security is designed in, not added afterwards."],
      bullets: [
        "All traffic is served over HTTPS.",
        "Sessions are signed server-side; roles are read from the database on every request, never trusted from the browser.",
        "Uploaded files are validated for type and size on the server and stored privately.",
        "Private documents are served through short-lived, signed URLs — never from a public folder.",
        "No card or bank details are collected online. Payments are made at the bursary or by bank transfer and are recorded only by authorised finance staff.",
        "Administrative actions are recorded in an append-only audit log.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "Academic records are retained permanently, because former pupils and their families rely on them for secondary school admission and beyond. Promotion between classes never overwrites a previous year's record.",
        "Unsuccessful admission applications and their uploaded documents are deleted twelve months after the decision. Enquiry records are deleted after twenty-four months.",
      ],
      bullets: [],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You may ask to see the information we hold about you or your child, ask us to correct anything inaccurate, or ask us to delete information we no longer need to keep.",
        "Write to {email} or to the school office at {address}. We respond to requests within thirty days.",
      ],
      bullets: [],
    },
    {
      heading: "Contact",
      paragraphs: ["Questions about this policy, or about how we handle your family's information, should go to the School Administrator at {email} or {phone}."],
      bullets: [],
    },
  ],
};

export const terms: CmsData["terms"] = {
  eyebrow: "Policies",
  title: "Terms of Use",
  lede: "The rules for using this website and the parent, pupil, teacher and administration portals.",
  updated: "2 October 2026",
  sections: [
    {
      heading: "Acceptance",
      paragraphs: ["By using this website or any portal operated by {school}, you agree to these terms. If you do not agree, please do not use the platform."],
      bullets: [],
    },
    {
      heading: "Accounts",
      paragraphs: [
        "Accounts are issued by the school to parents, pupils and staff, or created by applicants during an admission application.",
        "You are responsible for keeping your password confidential and for everything done under your account. Tell the school office immediately if you believe someone else has access to it.",
      ],
      bullets: [
        "Do not share your password or let another person use your account.",
        "Do not attempt to access records belonging to another family, pupil or member of staff.",
        "Pupil accounts are intended for the pupil, supervised by a parent where appropriate.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: ["This platform exists to support a child's education. Use it for that."],
      bullets: [
        "Do not upload anything unlawful, abusive, or that infringes someone else's rights.",
        "Do not attempt to probe, scan or test the security of the platform.",
        "Do not use automated tools to scrape content or overload the service.",
        "Do not re-publish photographs of other people's children taken at school events.",
      ],
    },
    {
      heading: "Content and accuracy",
      paragraphs: [
        "We work to keep information on this site accurate and current, but fees, dates, availability and staffing can change. Where a published figure conflicts with a document issued directly by the school office, the school office document takes precedence.",
        "Demonstration data on this platform is clearly marked and does not represent real pupils, families or transactions.",
      ],
      bullets: [],
    },
    {
      heading: "Payments",
      paragraphs: [
        "This platform does not accept online payments. Application fees, school fees and other charges are paid at the school bursary or by bank transfer to the school account, quoting the relevant application or invoice number.",
        "A payment is treated as received only once the school bursary has confirmed it. Payment records and receipts shown in the portals reflect payments the bursary has recorded.",
        "Application fees are non-refundable. Termly fee refunds are governed by the fee policy issued by the school office.",
      ],
      bullets: [],
    },
    {
      heading: "Availability",
      paragraphs: ["We aim to keep the platform available at all times but cannot guarantee uninterrupted service. Planned maintenance is announced in advance through the portals wherever possible."],
      bullets: [],
    },
    {
      heading: "Changes",
      paragraphs: ["We may update these terms. Material changes are announced in the portals, and the date at the top of this page always reflects the current version."],
      bullets: [],
    },
    {
      heading: "Contact",
      paragraphs: ["Questions about these terms should go to {email} or the school office at {address}."],
      bullets: [],
    },
  ],
};
