import type {
  AssessmentWeighting,
  ClassLevel,
  Facility,
  FeeCategory,
  Role,
} from "./types";

export const SCHOOL = {
  name: "El-Bethel International Academy",
  shortName: "EBIA",
  type: "Private Primary School",
  city: "Abuja",
  state: "Federal Capital Territory",
  country: "Nigeria",
  address: "No.3 Engr. Demola Oduneye Avenue, Opposite Ushafa Mini Stadium, Ushafa, Abuja",
  phone: "0812 390 8499",
  phoneHref: "+2348123908499",
  phoneAlt: "0803 567 2400",
  phoneAltHref: "+2348035672400",
  whatsapp: "0812 390 8499",
  whatsappHref: "https://wa.me/2348123908499",
  email: "info@elbethel.edu.ng",
  admissionsEmail: "admissions@elbethel.edu.ng",
  website: "www.elbethel.edu.ng",
  motto: "Knowledge and the fear of God",
  calendar: "September – July",
  session: "2026/2027",
  officeHours: "Monday – Friday, 7:30 AM – 4:00 PM",
  headteacher: "Dr. Amaka N. Okafor",
  social: {
    facebook: "https://facebook.com/ElBethelInternationalAcademy",
    instagram: "https://instagram.com/elbethelinternationalacademy",
    youtube: "https://youtube.com/@ElBethelInternationalAcademy",
    x: "https://x.com/ElBethelInternational",
  },
} as const;

export const SITE_URL = "https://www.elbethel.edu.ng";

export const VISION =
  "To be a leading primary school recognised for academic excellence, character development and the holistic growth of every child.";

export const MISSION =
  "To provide a safe, stimulating and inclusive learning environment where every child is challenged to discover their potential, develop strong character and acquire the knowledge, skills and values necessary for lifelong success.";

export const SCHOOL_ANTHEM: { kind: "verse" | "chorus"; label: string; lines: string[] }[] = [
  {
    kind: "verse",
    label: "Verse 1",
    lines: [
      "El Bethel International, we proudly stand,",
      "A place of wisdom, built by God’s own hand,",
      "With hearts so pure and minds so bright,",
      "We walk in truth, we shine His light.",
    ],
  },
  {
    kind: "chorus",
    label: "Chorus",
    lines: [
      "Knowledge and the fear of God, our guide,",
      "In faith and learning, we abide,",
      "With strength and grace, we rise each day,",
      "El Bethel leads us all the way.",
    ],
  },
  {
    kind: "verse",
    label: "Verse 2",
    lines: [
      "In righteousness, we grow and learn,",
      "With passion deep and hearts that yearn",
      "To serve the world in love and truth,",
      "Empowered minds and godly youth.",
    ],
  },
  {
    kind: "chorus",
    label: "Chorus",
    lines: [
      "Knowledge and the fear of God, our guide,",
      "In faith and learning, we abide,",
      "With strength and grace, we rise each day,",
      "El Bethel leads us all the way.",
    ],
  },
];

export const CORE_VALUES = [
  { name: "Excellence", icon: "Sparkles", text: "We set a high bar and support every child in reaching it." },
  { name: "Integrity", icon: "ShieldCheck", text: "We do the right thing, especially when nobody is watching." },
  { name: "Respect", icon: "HeartHandshake", text: "Every person in our community is treated with dignity." },
  { name: "Curiosity", icon: "Telescope", text: "Questions are welcome here — they are how learning begins." },
  { name: "Creativity", icon: "Palette", text: "We give children room to imagine, make and express." },
  { name: "Responsibility", icon: "Compass", text: "Children learn to own their choices and their learning." },
  { name: "Compassion", icon: "Heart", text: "Kindness is taught, modelled and expected." },
] as const;

export const HEADTEACHER_MESSAGE = [
  "Welcome to El-Bethel International Academy.",
  "At our school, we believe that education is not simply about filling young minds with information. It is about helping children discover who they are, what they can achieve and how they can contribute positively to the world around them.",
  "Every child who walks through our gates is unique. Our responsibility is to recognise that uniqueness, nurture it and provide the support and opportunities necessary for it to flourish.",
  "We combine strong academic foundations with creativity, technology, character development, sports and practical experiences. Most importantly, we believe that children learn best when they feel safe, valued, encouraged and inspired.",
  "We invite you to explore our school, meet our community and discover why El-Bethel International Academy is becoming one of Abuja's trusted destinations for quality primary education.",
];

export const SCHOOL_STATS = [
  { key: "pupils", label: "Pupils Enrolled", value: 390, suffix: "" },
  { key: "teachers", label: "Teaching Staff", value: 34, suffix: "" },
  { key: "classes", label: "Classes", value: 15, suffix: "" },
  { key: "clubs", label: "Clubs & Activities", value: 16, suffix: "" },
  { key: "classSize", label: "Average Class Size", value: 24, suffix: "" },
  { key: "ratio", label: "Pupils per Teacher", value: 12, suffix: ":1" },
  { key: "events", label: "Annual School Events", value: 30, suffix: "+" },
];

export const CLASS_LEVELS: ClassLevel[] = [
  { id: "lvl-p1", name: "Primary 1", stage: "lower_primary", order: 1 },
  { id: "lvl-p2", name: "Primary 2", stage: "lower_primary", order: 2 },
  { id: "lvl-p3", name: "Primary 3", stage: "lower_primary", order: 3 },
  { id: "lvl-p4", name: "Primary 4", stage: "upper_primary", order: 4 },
  { id: "lvl-p5", name: "Primary 5", stage: "upper_primary", order: 5 },
  { id: "lvl-p6", name: "Primary 6", stage: "upper_primary", order: 6 },
];

/** Sections per level, per the specification's sample class structure. */
export const LEVEL_SECTIONS: Record<string, string[]> = {
  "lvl-p1": ["A", "B", "C"],
  "lvl-p2": ["A", "B", "C"],
  "lvl-p3": ["A", "B", "C"],
  "lvl-p4": ["A", "B"],
  "lvl-p5": ["A", "B"],
  "lvl-p6": ["A", "B"],
};

export const LEVEL_POPULATION: Record<string, number> = {
  "lvl-p1": 72,
  "lvl-p2": 75,
  "lvl-p3": 78,
  "lvl-p4": 58,
  "lvl-p5": 55,
  "lvl-p6": 52,
};

export const ADMISSION_OPEN_LEVELS = [
  "lvl-p1",
  "lvl-p2",
  "lvl-p3",
  "lvl-p4",
];

export const TEACHING_METHODS = [
  "Classroom instruction",
  "Practical activities",
  "Collaborative learning",
  "Project-based learning",
  "Digital learning",
  "Educational games",
  "Creative expression",
  "Experiments",
  "Reading programmes",
  "Field trips",
  "Continuous assessment",
];

export const WHY_EL_BETHEL = [
  {
    title: "Strong Academic Foundation",
    icon: "GraduationCap",
    text: "Our curriculum provides children with the knowledge and skills required for success at every stage of their education.",
  },
  {
    title: "Caring Teachers",
    icon: "HeartHandshake",
    text: "Our teachers are trained to understand the academic, emotional and developmental needs of children.",
  },
  {
    title: "Technology-Enabled Learning",
    icon: "Cpu",
    text: "We introduce children to technology as a tool for creativity, learning and problem-solving.",
  },
  {
    title: "Character Development",
    icon: "ShieldCheck",
    text: "We intentionally develop values such as integrity, respect, responsibility and compassion.",
  },
  {
    title: "Safe Environment",
    icon: "Shield",
    text: "Child safety and wellbeing remain central to our school operations.",
  },
  {
    title: "Parent Partnership",
    icon: "Users",
    text: "We believe education works best when parents and teachers work together.",
  },
  {
    title: "Holistic Development",
    icon: "Sprout",
    text: "We nurture the academic, physical, social, emotional and creative development of every child.",
  },
];

export const FACILITIES: Facility[] = [
  {
    id: "fac-1",
    slug: "smart-classrooms",
    name: "Smart Classrooms",
    icon: "MonitorPlay",
    summary: "Interactive displays and flexible layouts that keep young learners engaged.",
    description:
      "Classrooms are designed to encourage interaction, collaboration and active learning. Selected classrooms feature interactive displays and digital learning resources.",
    highlights: ["Interactive displays", "Flexible seating", "Reading corners", "Display walls for pupil work"],
  },
  {
    id: "fac-2",
    slug: "ict-innovation-lab",
    name: "ICT & Innovation Lab",
    icon: "Cpu",
    summary: "Where pupils meet coding, robotics and digital creativity.",
    description:
      "The ICT and Innovation Lab introduces pupils to computer literacy, coding, robotics, digital creativity, internet safety and problem solving.",
    highlights: ["Computer literacy", "Coding", "Robotics", "Digital creativity", "Internet safety", "Problem solving"],
  },
  {
    id: "fac-3",
    slug: "science-laboratory",
    name: "Science Laboratory",
    icon: "FlaskConical",
    summary: "A child-friendly lab for hands-on discovery.",
    description:
      "A child-friendly laboratory where pupils explore scientific concepts through practical experiments.",
    highlights: ["Age-appropriate equipment", "Supervised experiments", "Nature study", "Science fair projects"],
  },
  {
    id: "fac-4",
    slug: "school-library",
    name: "School Library",
    icon: "BookOpen",
    summary: "Thousands of titles and quiet corners for growing readers.",
    description:
      "The library provides age-appropriate books, reading corners and guided reading activities designed to develop a lifelong love of reading.",
    highlights: ["Guided reading", "Borrowing system", "Story sessions", "Reading challenges"],
  },
  {
    id: "fac-5",
    slug: "creative-arts-studio",
    name: "Creative Arts Studio",
    icon: "Palette",
    summary: "A dedicated home for drawing, drama, music and making.",
    description:
      "A dedicated space for drawing, painting, crafts, drama, music and creative projects.",
    highlights: ["Drawing", "Painting", "Crafts", "Drama", "Music", "Creative projects"],
  },
  {
    id: "fac-6",
    slug: "football-pitch",
    name: "Football Pitch",
    icon: "Goal",
    summary: "Full-size grass pitch for training and inter-house fixtures.",
    description: "Our pitch hosts weekly football academy sessions, PE lessons and inter-house competitions.",
    highlights: ["Football academy", "Inter-house fixtures", "PE lessons"],
  },
  {
    id: "fac-7",
    slug: "basketball-court",
    name: "Basketball Court",
    icon: "CircleDot",
    summary: "Hard court with adjustable hoops sized for primary pupils.",
    description: "An outdoor court used for basketball coaching, PE and break-time play.",
    highlights: ["Adjustable hoops", "Coached sessions", "Break-time play"],
  },
  {
    id: "fac-8",
    slug: "volleyball-area",
    name: "Volleyball Area",
    icon: "Volleyball",
    summary: "Sand and hard-court volleyball for upper primary.",
    description: "A dedicated volleyball area used for upper-primary PE and the inter-house sports festival.",
    highlights: ["Upper primary PE", "Inter-house sports"],
  },
  {
    id: "fac-9",
    slug: "athletics-space",
    name: "Athletics Space",
    icon: "Timer",
    summary: "Marked track and field area for our annual sports festival.",
    description: "A marked track and field area supporting sprint, relay and field events throughout the year.",
    highlights: ["Track events", "Field events", "Annual sports festival"],
  },
  {
    id: "fac-10",
    slug: "childrens-playground",
    name: "Children's Playground",
    icon: "ToyBrick",
    summary: "Soft-surface play equipment for our lower primary pupils.",
    description: "Age-appropriate climbing frames, slides and swings on impact-absorbing surfacing, always supervised.",
    highlights: ["Soft surfacing", "Supervised play", "Lower primary focus"],
  },
  {
    id: "fac-11",
    slug: "medical-centre",
    name: "Medical Centre",
    icon: "Stethoscope",
    summary: "On-site school nurse and first-aid facilities every school day.",
    description:
      "A resident school nurse manages first aid, medication records, health screening and communication with parents.",
    highlights: ["Resident nurse", "First aid", "Health screening", "Medication records"],
  },
  {
    id: "fac-12",
    slug: "cafeteria",
    name: "Cafeteria",
    icon: "UtensilsCrossed",
    summary: "Freshly prepared, nutritionally balanced meals daily.",
    description: "Our kitchen prepares balanced meals daily, with allergy-aware menus shared with parents each term.",
    highlights: ["Balanced menus", "Allergy aware", "Termly menu published"],
  },
  {
    id: "fac-13",
    slug: "school-transport",
    name: "School Bus & Transport",
    icon: "Bus",
    summary: "Vetted drivers, trained attendants and monitored routes.",
    description:
      "Our transport service covers key Abuja districts with vetted drivers, a trained bus attendant on every route and daily pickup and drop-off logs.",
    highlights: ["Vetted drivers", "Bus attendants", "Route logs", "Parent notifications"],
  },
  {
    id: "fac-14",
    slug: "security",
    name: "Security",
    icon: "ShieldCheck",
    summary: "Controlled access, CCTV coverage and a strict release policy.",
    description:
      "Access to the school is controlled, the campus is under CCTV coverage and children are released only to authorised adults.",
    highlights: ["Controlled access", "CCTV coverage", "Authorised pickup only", "Visitor screening"],
  },
];

export const ADMISSION_FEES = [
  { label: "Application Fee", amount: 15000 },
  { label: "Assessment Fee", amount: 10000 },
  { label: "Registration Fee", amount: 35000 },
];

export const FEE_STRUCTURE: {
  band: string;
  levelIds: string[];
  lines: { category: FeeCategory; label: string; amount: number }[];
}[] = [
  {
    band: "Primary 1 – Primary 3",
    levelIds: ["lvl-p1", "lvl-p2", "lvl-p3"],
    lines: [
      { category: "tuition", label: "Tuition", amount: 280000 },
      { category: "learning_resources", label: "Learning Resources", amount: 35000 },
      { category: "activities", label: "Activities", amount: 20000 },
      { category: "technology", label: "Technology", amount: 15000 },
    ],
  },
  {
    band: "Primary 4 – Primary 6",
    levelIds: ["lvl-p4", "lvl-p5", "lvl-p6"],
    lines: [
      { category: "tuition", label: "Tuition", amount: 300000 },
      { category: "learning_resources", label: "Learning Resources", amount: 40000 },
      { category: "activities", label: "Activities", amount: 20000 },
      { category: "technology", label: "Technology", amount: 15000 },
    ],
  },
];

export const OPTIONAL_FEES: { category: FeeCategory; label: string; amount: number }[] = [
  { category: "transport", label: "Transport (per term)", amount: 65000 },
  { category: "meals", label: "Meals (per term)", amount: 55000 },
  { category: "uniform", label: "Uniform set", amount: 28000 },
  { category: "books", label: "Books & stationery", amount: 32000 },
];

export const ASSESSMENT_WEIGHTING: AssessmentWeighting[] = [
  { component: "classwork", label: "Classwork", weight: 10, maxScore: 10 },
  { component: "assignment", label: "Assignments", weight: 10, maxScore: 10 },
  { component: "test", label: "Tests", weight: 20, maxScore: 20 },
  { component: "exam", label: "Examination", weight: 60, maxScore: 60 },
];

export const GRADE_BANDS = [
  { min: 80, grade: "A", remark: "Excellent" },
  { min: 70, grade: "B", remark: "Very Good" },
  { min: 60, grade: "C", remark: "Good" },
  { min: 50, grade: "D", remark: "Fair" },
  { min: 40, grade: "E", remark: "Needs Support" },
  { min: 0, grade: "F", remark: "Requires Intervention" },
];

export function gradeFor(total: number): { grade: string; remark: string } {
  const band = GRADE_BANDS.find((b) => total >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
  return { grade: band.grade, remark: band.remark };
}

export const ACADEMIC_CALENDAR = [
  { name: "First Term", start: "2026-09-07", end: "2026-12-18", type: "term" as const },
  { name: "Christmas Break", start: "2026-12-19", end: "2027-01-10", type: "break" as const },
  { name: "Second Term", start: "2027-01-11", end: "2027-04-02", type: "term" as const },
  { name: "Easter Break", start: "2027-04-03", end: "2027-04-18", type: "break" as const },
  { name: "Third Term", start: "2027-04-19", end: "2027-07-23", type: "term" as const },
  { name: "Long Vacation", start: "2027-07-24", end: "2027-09-05", type: "break" as const },
];

export const CONDUCT_TRAITS = [
  "Punctuality",
  "Neatness",
  "Politeness",
  "Cooperation",
  "Attentiveness",
  "Initiative",
  "Responsibility",
];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Administrator",
  admin: "School Administrator",
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Headteacher",
  teacher: "Teacher",
  accountant: "Accountant",
  admissions_officer: "Admissions Officer",
  librarian: "Librarian",
  parent: "Parent",
  pupil: "Pupil",
  applicant: "Applicant",
};

export const APPLICATION_DOCUMENT_REQUIREMENTS = [
  { key: "birth_certificate", label: "Birth certificate or declaration of age", required: true },
  { key: "passport", label: "Passport photograph", required: true },
  { key: "school_report", label: "Previous school report", required: false },
  { key: "transfer", label: "Transfer document", required: false },
  { key: "medical", label: "Medical information", required: true },
  { key: "guardian_id", label: "Parent/guardian identification", required: true },
  { key: "other", label: "Other supporting documents", required: false },
];

export const PERIODS = [
  { period: 1, startTime: "08:00", endTime: "08:40" },
  { period: 2, startTime: "08:40", endTime: "09:20" },
  { period: 3, startTime: "09:20", endTime: "10:00" },
  { period: 4, startTime: "10:00", endTime: "10:30", label: "Break" },
  { period: 5, startTime: "10:30", endTime: "11:10" },
  { period: 6, startTime: "11:10", endTime: "11:50" },
  { period: 7, startTime: "11:50", endTime: "12:30" },
  { period: 8, startTime: "12:30", endTime: "13:10", label: "Lunch" },
  { period: 9, startTime: "13:10", endTime: "13:50" },
  { period: 10, startTime: "13:50", endTime: "14:30" },
];

export const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_SUBMISSION_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
