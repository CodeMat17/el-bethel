import {
  APPLICATION_DOCUMENT_REQUIREMENTS,
  ASSESSMENT_WEIGHTING,
  CLASS_LEVELS,
  CONDUCT_TRAITS,
  FEE_STRUCTURE,
  PERIODS,
  gradeFor,
} from "./config";
import type {
  Achievement,
  AcademicSession,
  AppNotification,
  Application,
  Appointment,
  Assignment,
  AttendanceRecord,
  AttendanceStatus,
  AuditLog,
  Book,
  Borrowing,
  Certificate,
  Club,
  EmergencyNotice,
  Enquiry,
  FaqItem,
  GalleryItem,
  Invoice,
  LearningMaterial,
  MessageThread,
  NewsPost,
  Parent,
  Payment,
  Question,
  QuestionAnswer,
  Quiz,
  QuizAttempt,
  ReportCard,
  ResultEntry,
  Role,
  SchoolClass,
  SchoolDocument,
  SchoolEvent,
  Student,
  Subject,
  Submission,
  Teacher,
  TeacherAvailability,
  Testimonial,
  TimetableSlot,
  TourBooking,
  TransportRoute,
  User,
  Vacancy,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Deterministic pseudo-random generator                                       */
/* -------------------------------------------------------------------------- */

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(20262027);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const chance = (p: number) => rng() < p;

/** Fixed demo clock — keeps server and client rendering identical. */
export const DEMO_TODAY = new Date("2026-09-28T09:15:00.000Z");
export const nowISO = () => DEMO_TODAY.toISOString();

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
const iso = (d: Date) => d.toISOString();
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/*
 * Demo-only shape of the school. The live site reads classes, pupils, sessions
 * and terms from Convex; these only decide what the seed creates.
 */

/** Sections per level. */
const LEVEL_SECTIONS: Record<string, string[]> = {
  "lvl-cre": ["A"],
  "lvl-pre": ["A"],
  "lvl-n1": ["A", "B"],
  "lvl-n2": ["A", "B"],
  "lvl-n3": ["A", "B"],
  "lvl-p1": ["A", "B", "C"],
  "lvl-p2": ["A", "B", "C"],
  "lvl-p3": ["A", "B", "C"],
  "lvl-p4": ["A", "B"],
  "lvl-p5": ["A", "B"],
  "lvl-p6": ["A", "B"],
  "lvl-j1": ["A", "B"],
  "lvl-j2": ["A", "B"],
  "lvl-j3": ["A", "B"],
};

const LEVEL_POPULATION: Record<string, number> = {
  "lvl-cre": 18,
  "lvl-pre": 22,
  "lvl-n1": 40,
  "lvl-n2": 42,
  "lvl-n3": 44,
  "lvl-p1": 72,
  "lvl-p2": 75,
  "lvl-p3": 78,
  "lvl-p4": 58,
  "lvl-p5": 55,
  "lvl-p6": 52,
  "lvl-j1": 48,
  "lvl-j2": 44,
  "lvl-j3": 40,
};

const ACADEMIC_CALENDAR = [
  { name: "First Term", start: "2026-09-07", end: "2026-12-18", type: "term" as const },
  { name: "Christmas Break", start: "2026-12-19", end: "2027-01-10", type: "break" as const },
  { name: "Second Term", start: "2027-01-11", end: "2027-04-02", type: "term" as const },
  { name: "Easter Break", start: "2027-04-03", end: "2027-04-18", type: "break" as const },
  { name: "Third Term", start: "2027-04-19", end: "2027-07-23", type: "term" as const },
  { name: "Long Vacation", start: "2027-07-24", end: "2027-09-05", type: "break" as const },
];

/* -------------------------------------------------------------------------- */
/* Name pools                                                                  */
/* -------------------------------------------------------------------------- */

const MALE_FIRST = [
  "David", "Emeka", "Daniel", "Samuel", "Michael", "Ibrahim", "Chidi", "Tunde", "Musa", "Obinna",
  "Ayo", "Kelechi", "Nnamdi", "Yusuf", "Femi", "Chukwuemeka", "Segun", "Bala", "Uche", "Tobi",
  "Ifeanyi", "Abdul", "Peter", "Joshua", "Gideon", "Kunle", "Ekene", "Sadiq", "Chinedu", "Timilehin",
];
const FEMALE_FIRST = [
  "Mary", "Amaka", "Sarah", "Grace", "Chiamaka", "Aisha", "Ngozi", "Fatima", "Blessing", "Zainab",
  "Adaeze", "Temitope", "Esther", "Halima", "Favour", "Oluwaseun", "Ifeoma", "Rashida", "Chioma", "Nneka",
  "Adaobi", "Bisola", "Hauwa", "Precious", "Simisola", "Uchechi", "Yetunde", "Kemi", "Ngozika", "Damilola",
];
const SURNAMES = [
  "Okafor", "Adeyemi", "Ibrahim", "Chukwu", "Bello", "Nwosu", "Eze", "Musa", "Okoro", "Yusuf",
  "Obi", "Adebayo", "Okeke", "Lawal", "Ogunleye", "Danjuma", "Uzoma", "Abubakar", "Olawale", "Nnaji",
  "Balogun", "Ekwueme", "Suleiman", "Onyeka", "Aliyu", "Ojo", "Igwe", "Sani", "Emeka", "Oyelaran",
];
const OCCUPATIONS = [
  "Civil Servant", "Medical Doctor", "Banker", "Software Engineer", "Entrepreneur", "Lawyer",
  "Architect", "Accountant", "Lecturer", "Pharmacist", "Nurse", "Consultant", "Trader", "Engineer",
];
const DISTRICTS = [
  "Ushafa", "Wuse II", "Maitama", "Gwarinpa", "Utako", "Asokoro", "Life Camp", "Lokogoma", "Katampe",
  "Garki", "Kubwa", "Lugbe",
];
const HOUSES = ["Emerald", "Sapphire", "Ruby", "Amber"] as const;
const BLOOD = ["O+", "A+", "B+", "AB+", "O-", "A-"];

const address = () => `${int(1, 98)} ${pick(["Aso", "Crest", "Palm", "Cedar", "Zenith", "Nile"])} ${pick(["Close", "Crescent", "Avenue", "Street"])}, ${pick(DISTRICTS)}, Abuja`;
const phone = () => `+234 8${int(0, 1)}${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`;

/* -------------------------------------------------------------------------- */
/* Sessions and terms                                                          */
/* -------------------------------------------------------------------------- */

const sessions: AcademicSession[] = [
  { id: "ses-2024", name: "2024/2025", startDate: "2024-09-09", endDate: "2025-07-25", active: false },
  { id: "ses-2025", name: "2025/2026", startDate: "2025-09-08", endDate: "2026-07-24", active: false },
  { id: "ses-2026", name: "2026/2027", startDate: "2026-09-07", endDate: "2027-07-23", active: true },
];

const terms = [
  {
    id: "term-2026-1", sessionId: "ses-2026", key: "first" as const, name: "First Term",
    startDate: "2026-09-07", endDate: "2026-12-18", examStart: "2026-12-07", examEnd: "2026-12-16",
    resultPublishDate: "2026-12-18", active: true,
  },
  {
    id: "term-2026-2", sessionId: "ses-2026", key: "second" as const, name: "Second Term",
    startDate: "2027-01-11", endDate: "2027-04-02", examStart: "2027-03-22", examEnd: "2027-03-31",
    resultPublishDate: "2027-04-02", active: false,
  },
  {
    id: "term-2026-3", sessionId: "ses-2026", key: "third" as const, name: "Third Term",
    startDate: "2027-04-19", endDate: "2027-07-23", examStart: "2027-07-12", examEnd: "2027-07-21",
    resultPublishDate: "2027-07-23", active: false,
  },
  {
    id: "term-2025-3", sessionId: "ses-2025", key: "third" as const, name: "Third Term",
    startDate: "2026-04-20", endDate: "2026-07-24", examStart: "2026-07-13", examEnd: "2026-07-22",
    resultPublishDate: "2026-07-24", active: false,
  },
  {
    id: "term-2025-2", sessionId: "ses-2025", key: "second" as const, name: "Second Term",
    startDate: "2026-01-12", endDate: "2026-04-03", examStart: "2026-03-23", examEnd: "2026-04-01",
    resultPublishDate: "2026-04-03", active: false,
  },
];

const ACTIVE_TERM_ID = "term-2026-1";

/* -------------------------------------------------------------------------- */
/* Subjects                                                                    */
/* -------------------------------------------------------------------------- */

const ALL_LEVELS = CLASS_LEVELS.map((l) => l.id);
const EARLY_YEARS = ["lvl-cre", "lvl-pre"];
const NURSERY_LEVELS = ["lvl-n1", "lvl-n2", "lvl-n3"];
const PRIMARY_LEVELS = ["lvl-p1", "lvl-p2", "lvl-p3", "lvl-p4", "lvl-p5", "lvl-p6"];
const UPPER_PRIMARY = ["lvl-p4", "lvl-p5", "lvl-p6"];
const JSS_LEVELS = ["lvl-j1", "lvl-j2", "lvl-j3"];
const PRIMARY_AND_JSS = [...PRIMARY_LEVELS, ...JSS_LEVELS];
const NURSERY_AND_UP = [...NURSERY_LEVELS, ...PRIMARY_LEVELS, ...JSS_LEVELS];

const subjects: Subject[] = [
  // Creche and Pre-School
  { id: "sub-play", name: "Play & Discovery", code: "PLY", group: "core", levelIds: EARLY_YEARS },
  { id: "sub-lang", name: "Language & Communication", code: "LNG", group: "core", levelIds: EARLY_YEARS },
  { id: "sub-motor", name: "Motor Skills & Movement", code: "MOT", group: "core", levelIds: EARLY_YEARS },
  { id: "sub-hab", name: "Health & Self-Help Habits", code: "HAB", group: "additional", levelIds: [...EARLY_YEARS, ...NURSERY_LEVELS] },

  // Nursery
  { id: "sub-lit", name: "Literacy & Rhymes", code: "LIT", group: "core", levelIds: NURSERY_LEVELS },
  { id: "sub-num", name: "Number Work", code: "NUM", group: "core", levelIds: NURSERY_LEVELS },
  { id: "sub-pho", name: "Phonics", code: "PHO", group: "core", levelIds: NURSERY_LEVELS },
  { id: "sub-env", name: "Basic Science & Environment", code: "ENV", group: "core", levelIds: NURSERY_LEVELS },

  // Primary and Junior Secondary
  { id: "sub-eng", name: "English Studies", code: "ENG", group: "core", levelIds: PRIMARY_AND_JSS },
  { id: "sub-mth", name: "Mathematics", code: "MTH", group: "core", levelIds: PRIMARY_AND_JSS },
  { id: "sub-bsc", name: "Basic Science", code: "BSC", group: "core", levelIds: PRIMARY_AND_JSS },
  { id: "sub-sst", name: "Social Studies", code: "SST", group: "core", levelIds: PRIMARY_AND_JSS },
  { id: "sub-civ", name: "Civic Education", code: "CIV", group: "core", levelIds: PRIMARY_AND_JSS },
  { id: "sub-cmp", name: "Computer Studies", code: "CMP", group: "additional", levelIds: NURSERY_AND_UP },
  { id: "sub-qr", name: "Quantitative Reasoning", code: "QNR", group: "additional", levelIds: PRIMARY_LEVELS },
  { id: "sub-vr", name: "Verbal Reasoning", code: "VBR", group: "additional", levelIds: PRIMARY_LEVELS },
  { id: "sub-fre", name: "French", code: "FRE", group: "additional", levelIds: PRIMARY_AND_JSS },
  { id: "sub-crs", name: "Christian Religious Studies", code: "CRS", group: "additional", levelIds: PRIMARY_AND_JSS },
  { id: "sub-irs", name: "Islamic Religious Studies", code: "IRS", group: "additional", levelIds: PRIMARY_AND_JSS },
  { id: "sub-art", name: "Creative Arts", code: "ART", group: "additional", levelIds: NURSERY_AND_UP },
  { id: "sub-mus", name: "Music", code: "MUS", group: "additional", levelIds: NURSERY_AND_UP },
  { id: "sub-phe", name: "Physical & Health Education", code: "PHE", group: "additional", levelIds: NURSERY_AND_UP },
  { id: "sub-hec", name: "Home Economics", code: "HEC", group: "additional", levelIds: [...UPPER_PRIMARY, ...JSS_LEVELS] },
  { id: "sub-agr", name: "Agricultural Science", code: "AGR", group: "additional", levelIds: [...UPPER_PRIMARY, ...JSS_LEVELS] },

  // Junior Secondary only
  { id: "sub-bte", name: "Basic Technology", code: "BTE", group: "core", levelIds: JSS_LEVELS },
  { id: "sub-bus", name: "Business Studies", code: "BUS", group: "core", levelIds: JSS_LEVELS },
  { id: "sub-nva", name: "National Values Education", code: "NVE", group: "core", levelIds: JSS_LEVELS },
  { id: "sub-lng", name: "Nigerian Language (Hausa)", code: "HAU", group: "additional", levelIds: JSS_LEVELS },
  { id: "sub-cca", name: "Cultural & Creative Arts", code: "CCA", group: "additional", levelIds: JSS_LEVELS },
  { id: "sub-lir", name: "Literature-in-English", code: "LIR", group: "additional", levelIds: JSS_LEVELS },
];

/** Subjects a class actually studies (assessed subjects, capped for report cards). */
export function subjectsForLevel(levelId: string): Subject[] {
  return subjects.filter((s) => s.levelIds.includes(levelId));
}

/* -------------------------------------------------------------------------- */
/* Teachers                                                                    */
/* -------------------------------------------------------------------------- */

const NAMED_STAFF: {
  title: string; firstName: string; lastName: string; position: string; department: string;
  className?: string; subjectIds: string[]; featured: boolean;
}[] = [
  { title: "Dr.", firstName: "Amaka", lastName: "Okafor", position: "Headteacher", department: "Leadership", subjectIds: [], featured: true },
  { title: "Mr.", firstName: "Ifeanyi", lastName: "Adeyemi", position: "Deputy Headteacher (Academics)", department: "Leadership", subjectIds: ["sub-mth"], featured: true },
  { title: "Mrs.", firstName: "Zainab", lastName: "Lawal", position: "Head of Early Years", department: "Leadership", subjectIds: ["sub-lit"], featured: true },
  { title: "Mr.", firstName: "Emeka", lastName: "Nnamdi", position: "Head of Junior Secondary", department: "Leadership", subjectIds: ["sub-bsc"], featured: true },
  { title: "Miss", firstName: "Blessing", lastName: "Ogun", position: "Creche Care Lead", department: "Early Years", className: "Creche", subjectIds: ["sub-play", "sub-motor"], featured: true },
  { title: "Mrs.", firstName: "Ngozi", lastName: "Uche", position: "Pre-School Teacher", department: "Early Years", className: "Pre-School", subjectIds: ["sub-play", "sub-lang"], featured: true },
  { title: "Miss", firstName: "Rukayat", lastName: "Salami", position: "Class Teacher", department: "Nursery", className: "Nursery 1A", subjectIds: ["sub-lit", "sub-num"], featured: true },
  { title: "Mrs.", firstName: "Joy", lastName: "Aliyu", position: "Class Teacher", department: "Nursery", className: "Nursery 2A", subjectIds: ["sub-pho", "sub-num"], featured: true },
  { title: "Mrs.", firstName: "Patience", lastName: "Etim", position: "Class Teacher", department: "Nursery", className: "Nursery 3A", subjectIds: ["sub-lit", "sub-env"], featured: true },
  { title: "Mrs.", firstName: "Grace", lastName: "Eze", position: "Class Teacher", department: "Lower Primary", className: "Primary 1A", subjectIds: ["sub-eng", "sub-mth"], featured: true },
  { title: "Mr.", firstName: "Daniel", lastName: "Ibrahim", position: "Class Teacher", department: "Lower Primary", className: "Primary 2A", subjectIds: ["sub-eng", "sub-mth"], featured: true },
  { title: "Mrs.", firstName: "Sarah", lastName: "Adeyemi", position: "Class Teacher", department: "Lower Primary", className: "Primary 3A", subjectIds: ["sub-eng", "sub-bsc"], featured: true },
  { title: "Miss", firstName: "Chiamaka", lastName: "Obi", position: "Class Teacher", department: "Upper Primary", className: "Primary 4A", subjectIds: ["sub-eng", "sub-sst"], featured: true },
  { title: "Mr.", firstName: "David", lastName: "Musa", position: "Class Teacher", department: "Upper Primary", className: "Primary 5A", subjectIds: ["sub-bsc", "sub-agr"], featured: true },
  { title: "Mrs.", firstName: "Helen", lastName: "Okoro", position: "Class Teacher", department: "Upper Primary", className: "Primary 6A", subjectIds: ["sub-mth", "sub-qr"], featured: true },
  { title: "Mr.", firstName: "Kelechi", lastName: "Anyanwu", position: "Form Teacher", department: "Junior Secondary", className: "JSS 1A", subjectIds: ["sub-mth", "sub-bte"], featured: true },
  { title: "Mrs.", firstName: "Fatima", lastName: "Sani", position: "Form Teacher", department: "Junior Secondary", className: "JSS 2A", subjectIds: ["sub-eng", "sub-lir"], featured: true },
  { title: "Mr.", firstName: "Peter", lastName: "Danjuma", position: "Form Teacher", department: "Junior Secondary", className: "JSS 3A", subjectIds: ["sub-bsc", "sub-bus"], featured: true },
  { title: "Mr.", firstName: "Samuel", lastName: "Yusuf", position: "Mathematics Teacher", department: "Mathematics", subjectIds: ["sub-mth", "sub-qr"], featured: true },
  { title: "Mrs.", firstName: "Esther", lastName: "Bello", position: "English Teacher", department: "Languages", subjectIds: ["sub-eng", "sub-vr"], featured: true },
  { title: "Mr.", firstName: "Michael", lastName: "Nwosu", position: "ICT Teacher", department: "Technology", subjectIds: ["sub-cmp"], featured: true },
  { title: "Miss", firstName: "Favour", lastName: "Okeke", position: "Creative Arts Teacher", department: "Creative Arts", subjectIds: ["sub-art", "sub-mus"], featured: true },
  { title: "Mme.", firstName: "Adaobi", lastName: "Ojo", position: "French Teacher", department: "Languages", subjectIds: ["sub-fre"], featured: true },
  { title: "Mr.", firstName: "Tunde", lastName: "Balogun", position: "Physical Education Teacher", department: "Sports", subjectIds: ["sub-phe"], featured: true },
];

const QUALIFICATIONS = [
  "B.Ed Primary Education", "B.A Education (English)", "B.Sc Mathematics", "PGDE",
  "M.Ed Curriculum Studies", "NCE Primary Education", "B.Sc Computer Science", "B.A Education (History)",
  "NCE Early Childhood Education", "B.Ed Early Childhood & Care", "B.Sc Integrated Science", "B.Sc Business Education",
];

const teachers: Teacher[] = [];
const classes: (SchoolClass & { classTeacherId: string })[] = [];

// Build class shells first so class teachers can be attached.
const classShells: { id: string; levelId: string; name: string; section: string }[] = [];
for (const level of CLASS_LEVELS) {
  for (const section of LEVEL_SECTIONS[level.id]) {
    const name = LEVEL_SECTIONS[level.id].length > 1 ? `${level.name}${section}` : level.name;
    classShells.push({ id: `cls-${level.id.replace("lvl-", "")}${section.toLowerCase()}`, levelId: level.id, name, section });
  }
}

for (let i = 0; i < 58; i++) {
  const named = NAMED_STAFF[i];
  const isFemale = named ? ["Mrs.", "Miss", "Dr.", "Mme."].includes(named.title) : chance(0.62);
  const firstName = named ? named.firstName : pick(isFemale ? FEMALE_FIRST : MALE_FIRST);
  const lastName = named ? named.lastName : pick(SURNAMES);
  const title = named ? named.title : isFemale ? pick(["Mrs.", "Miss"]) : "Mr.";
  const subjectIds = named && named.subjectIds.length ? named.subjectIds : [pick(subjects).id, pick(subjects).id];
  const id = `tch-${String(i + 1).padStart(3, "0")}`;
  teachers.push({
    id,
    staffNo: `EIA/STF/${String(i + 1).padStart(3, "0")}`,
    firstName,
    lastName,
    title,
    position: named ? named.position : pick(["Class Teacher", "Subject Teacher", "Assistant Teacher", "Learning Support Teacher"]),
    department: named ? named.department : pick(["Early Years", "Nursery", "Lower Primary", "Upper Primary", "Junior Secondary", "Languages", "Mathematics", "Sciences", "Creative Arts", "Sports", "Technology"]),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ebia.com.ng`,
    phone: phone(),
    qualifications: [pick(QUALIFICATIONS), ...(chance(0.4) ? [pick(QUALIFICATIONS)] : [])],
    experienceYears: int(2, 21),
    bio: `${title} ${firstName} ${lastName} has spent ${int(2, 21)} years teaching young learners and believes every child deserves a classroom where their questions are taken seriously.`,
    subjectIds: Array.from(new Set(subjectIds)),
    classIds: [],
    isClassTeacher: false,
    active: true,
    joinedAt: `${int(2012, 2025)}-09-0${int(1, 9)}`,
    avatarSeed: `${firstName}${lastName}`,
    featured: named ? named.featured : false,
  });
}

// Assign class teachers: the named ones keep their advertised class, rest fill in.
const namedClassTeacher = new Map<string, string>();
NAMED_STAFF.forEach((s, i) => {
  if (s.className) namedClassTeacher.set(s.className, `tch-${String(i + 1).padStart(3, "0")}`);
});

let rotatingTeacher = NAMED_STAFF.length + 1;
for (const shell of classShells) {
  const explicit = namedClassTeacher.get(shell.name);
  const teacherId = explicit ?? `tch-${String((rotatingTeacher++ % 58) + 1).padStart(3, "0")}`;
  const teacher = teachers.find((t) => t.id === teacherId);
  if (teacher) {
    teacher.isClassTeacher = true;
    teacher.classIds.push(shell.id);
  }
  classes.push({
    id: shell.id,
    levelId: shell.levelId,
    name: shell.name,
    section: shell.section,
    classTeacherId: teacherId,
    capacity: 30,
    room: `Block ${pick(["A", "B", "C"])} · Room ${int(1, 18)}`,
  });
}

// Subject teachers also get classes assigned to them.
for (const cls of classes) {
  const levelSubjects = subjectsForLevel(cls.levelId);
  for (const subject of levelSubjects) {
    const candidates = teachers.filter((t) => t.subjectIds.includes(subject.id));
    const teacher = candidates.length ? candidates[int(0, candidates.length - 1)] : teachers[int(0, teachers.length - 1)];
    if (!teacher.classIds.includes(cls.id)) teacher.classIds.push(cls.id);
    if (!teacher.subjectIds.includes(subject.id)) teacher.subjectIds.push(subject.id);
  }
}

/** Who teaches subject X in class Y. Stable lookup used across the app. */
const teachingAssignments = new Map<string, string>();
for (const cls of classes) {
  for (const subject of subjectsForLevel(cls.levelId)) {
    const candidates = teachers.filter((t) => t.subjectIds.includes(subject.id) && t.classIds.includes(cls.id));
    const chosen = candidates.length ? candidates[0] : teachers.find((t) => t.id === cls.classTeacherId);
    teachingAssignments.set(`${cls.id}:${subject.id}`, chosen ? chosen.id : cls.classTeacherId);
  }
}
// The demo maths and English teachers own those subjects in the demo pupil's class.
teachingAssignments.set("cls-p4a:sub-mth", "tch-019");
teachingAssignments.set("cls-p4a:sub-eng", "tch-013");

/* -------------------------------------------------------------------------- */
/* Students and parents                                                        */
/* -------------------------------------------------------------------------- */

const students: Student[] = [];
const parents: Parent[] = [];

const DEMO_STUDENT_ID = "std-0001";
const DEMO_PARENT_ID = "par-0001";

let studentCounter = 0;
let parentCounter = 0;

function makeParent(lastName: string, studentIds: string[], forced?: Partial<Parent>): Parent {
  parentCounter += 1;
  const relationship = forced?.relationship ?? (chance(0.55) ? "Mother" : "Father");
  const isFemale = relationship === "Mother";
  const firstName = forced?.firstName ?? pick(isFemale ? FEMALE_FIRST : MALE_FIRST);
  const parent: Parent = {
    id: forced?.id ?? `par-${String(parentCounter).padStart(4, "0")}`,
    title: forced?.title ?? (isFemale ? "Mrs." : "Mr."),
    firstName,
    lastName,
    relationship,
    email: forced?.email ?? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${parentCounter}@example.com`,
    phone: phone(),
    occupation: pick(OCCUPATIONS),
    address: address(),
    emergencyContactName: `${pick(chance(0.5) ? FEMALE_FIRST : MALE_FIRST)} ${lastName}`,
    emergencyContactPhone: phone(),
    studentIds,
    avatarSeed: `${firstName}${lastName}${parentCounter}`,
  };
  return parent;
}

// Demo family first: Mrs. Ada Chukwu with three children (spec sections 28 & 101).
const demoParent = makeParent("Chukwu", [], {
  id: DEMO_PARENT_ID,
  title: "Mrs.",
  firstName: "Ada",
  relationship: "Mother",
  email: "parent@ebia.com.ng",
});
parents.push(demoParent);

function makeStudent(classId: string, lastName: string, parentIds: string[], forced?: Partial<Student>): Student {
  studentCounter += 1;
  const gender: Student["gender"] = forced?.gender ?? (chance(0.5) ? "Male" : "Female");
  const firstName = forced?.firstName ?? pick(gender === "Male" ? MALE_FIRST : FEMALE_FIRST);
  const cls = classes.find((c) => c.id === classId);
  const level = CLASS_LEVELS.find((l) => l.id === cls?.levelId);
  const age = level?.entryAge ?? 6;
  const student: Student = {
    id: forced?.id ?? `std-${String(studentCounter).padStart(4, "0")}`,
    studentNo: forced?.studentNo ?? `EIA-2026-${String(studentCounter).padStart(5, "0")}`,
    admissionNo: forced?.admissionNo ?? `EIA/${2026 - (level?.order ?? 1)}/${String(int(100, 999))}`,
    firstName,
    middleName: chance(0.6) ? pick(gender === "Male" ? MALE_FIRST : FEMALE_FIRST) : undefined,
    lastName,
    dateOfBirth: `${2026 - age}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`,
    gender,
    nationality: "Nigerian",
    address: address(),
    classId,
    parentIds,
    status: "active",
    enrolledAt: `${2026 - (level?.order ?? 1) + 1}-09-08`,
    avatarSeed: `${firstName}${lastName}${studentCounter}`,
    house: pick(HOUSES),
    bloodGroup: pick(BLOOD),
    transportRouteId: undefined,
  };
  return student;
}

const demoDavid = makeStudent("cls-p4a", "Chukwu", [DEMO_PARENT_ID], {
  id: DEMO_STUDENT_ID,
  firstName: "David",
  gender: "Male",
  studentNo: "EIA-2026-00482",
  admissionNo: "EIA/2022/0184",
});
const demoMary = makeStudent("cls-p2a", "Chukwu", [DEMO_PARENT_ID], { firstName: "Mary", gender: "Female" });
const demoSarah = makeStudent("cls-n3a", "Chukwu", [DEMO_PARENT_ID], { firstName: "Sarah", gender: "Female" });
students.push(demoDavid, demoMary, demoSarah);
demoParent.studentIds = [demoDavid.id, demoMary.id, demoSarah.id];

// Remaining pupils, distributed across classes according to level population targets.
const classTargets = new Map<string, number>();
for (const level of CLASS_LEVELS) {
  const sections = LEVEL_SECTIONS[level.id];
  const total = LEVEL_POPULATION[level.id];
  const per = Math.floor(total / sections.length);
  sections.forEach((section, idx) => {
    const id = `cls-${level.id.replace("lvl-", "")}${section.toLowerCase()}`;
    classTargets.set(id, idx === sections.length - 1 ? total - per * (sections.length - 1) : per);
  });
}
for (const s of students) {
  classTargets.set(s.classId, (classTargets.get(s.classId) ?? 1) - 1);
}

for (const cls of classes) {
  const target = classTargets.get(cls.id) ?? 0;
  for (let i = 0; i < target; i++) {
    const lastName = pick(SURNAMES);
    // ~20% of families have a sibling already enrolled.
    const sibling = chance(0.18) ? students.find((s) => s.lastName === lastName && s.parentIds.length) : undefined;
    if (sibling) {
      const student = makeStudent(cls.id, lastName, sibling.parentIds);
      students.push(student);
      for (const pid of sibling.parentIds) {
        const p = parents.find((x) => x.id === pid);
        if (p) p.studentIds.push(student.id);
      }
    } else {
      const parent = makeParent(lastName, []);
      const student = makeStudent(cls.id, lastName, [parent.id]);
      parent.studentIds = [student.id];
      parents.push(parent);
      students.push(student);
    }
  }
}

const studentsByClass = new Map<string, Student[]>();
for (const s of students) {
  const list = studentsByClass.get(s.classId) ?? [];
  list.push(s);
  studentsByClass.set(s.classId, list);
}

/* -------------------------------------------------------------------------- */
/* Timetable                                                                   */
/* -------------------------------------------------------------------------- */

const timetable: TimetableSlot[] = [];
for (const cls of classes) {
  const levelSubjects = subjectsForLevel(cls.levelId);
  for (let day = 1; day <= 5; day++) {
    PERIODS.forEach((p, idx) => {
      const isBreak = Boolean(p.label);
      const subject = isBreak ? null : levelSubjects[(day * 3 + idx) % levelSubjects.length];
      timetable.push({
        id: `tt-${cls.id}-${day}-${p.period}`,
        classId: cls.id,
        day,
        period: p.period,
        startTime: p.startTime,
        endTime: p.endTime,
        subjectId: subject ? subject.id : undefined,
        teacherId: subject ? teachingAssignments.get(`${cls.id}:${subject.id}`) ?? cls.classTeacherId : undefined,
        label: p.label,
      });
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Assignments and submissions                                                 */
/* -------------------------------------------------------------------------- */

const ASSIGNMENT_TEMPLATES: { subjectId: string; title: string; topic: string; instructions: string }[] = [
  { subjectId: "sub-mth", title: "Fractions Around Us", topic: "Fractions", instructions: "Solve questions 1–10 in your mathematics exercise book. Take a clear photograph of your completed work and upload it through the assignment portal." },
  { subjectId: "sub-eng", title: "Parts of Speech", topic: "Grammar", instructions: "Write ten sentences and underline the nouns, verbs and adjectives in each one." },
  { subjectId: "sub-bsc", title: "Living and Non-Living Things", topic: "Living Things", instructions: "List ten living and ten non-living things you can find at home, and say how you decided." },
  { subjectId: "sub-sst", title: "Our Community", topic: "Community Helpers", instructions: "Draw and label five people who help our community and describe what each of them does." },
  { subjectId: "sub-cmp", title: "Parts of a Computer", topic: "Computer Hardware", instructions: "Label the parts of a computer on the worksheet provided and explain what two of them do." },
  { subjectId: "sub-art", title: "Colour Wheel", topic: "Colour Theory", instructions: "Create your own colour wheel using primary and secondary colours. Photograph your work and upload it." },
  { subjectId: "sub-vr", title: "Word Relationships", topic: "Analogies", instructions: "Complete the twelve analogy questions on the worksheet." },
  { subjectId: "sub-qr", title: "Number Patterns", topic: "Sequences", instructions: "Continue each number pattern and explain the rule you used." },
  { subjectId: "sub-fre", title: "Basic Greetings", topic: "Salutations", instructions: "Record or write out five French greetings and when you would use each one." },
  { subjectId: "sub-civ", title: "Good Citizenship", topic: "Citizenship", instructions: "Write a short paragraph about one thing you can do to be a good citizen at school." },
  { subjectId: "sub-mth", title: "Multiplication Tables 6–9", topic: "Multiplication", instructions: "Practise your 6 to 9 times tables and complete the speed drill sheet." },
  { subjectId: "sub-eng", title: "Reading Comprehension: The Kind Farmer", topic: "Comprehension", instructions: "Read the passage carefully and answer all eight questions in complete sentences." },
  { subjectId: "sub-bsc", title: "The Water Cycle", topic: "Water Cycle", instructions: "Draw and label the water cycle. Write two sentences explaining evaporation." },
  { subjectId: "sub-sst", title: "Nigerian Cultural Groups", topic: "Culture", instructions: "Choose one Nigerian cultural group and write five facts about their traditions." },
  { subjectId: "sub-mus", title: "Rhythm and Beat", topic: "Rhythm", instructions: "Clap the rhythm patterns on the sheet and record yourself performing pattern three." },
  { subjectId: "sub-phe", title: "Healthy Habits", topic: "Health", instructions: "Keep a healthy-habits diary for three days and bring it to class." },
  { subjectId: "sub-agr", title: "Parts of a Plant", topic: "Plants", instructions: "Label the parts of a plant and describe the job of the roots and the leaves." },
  { subjectId: "sub-hec", title: "Keeping Our Homes Clean", topic: "Home Management", instructions: "List the cleaning tasks you helped with this week and what you learnt." },
  { subjectId: "sub-crs", title: "Kindness in Action", topic: "Values", instructions: "Write about a time you showed kindness to someone and how it made you feel." },
  { subjectId: "sub-cmp", title: "Staying Safe Online", topic: "Internet Safety", instructions: "List five rules for staying safe on the internet and why each rule matters." },
  { subjectId: "sub-eng", title: "Creative Writing: My Best Day", topic: "Composition", instructions: "Write a composition of at least fifteen sentences about your best day this year." },
  { subjectId: "sub-mth", title: "Measuring Length", topic: "Measurement", instructions: "Measure five items at home in centimetres and record your results in a table." },
];

const assignments: Assignment[] = [];
const submissions: Submission[] = [];

const OTHER_TOPICS = ["Shapes", "Animals", "Weather", "Transport", "Music", "Festivals", "Money", "Time"];

/** Every demo assignment uses the three answer formats a teacher can choose from. */
function demoQuestions(topic: string, instructions: string): Question[] {
  const distractors = OTHER_TOPICS.filter((t) => t !== topic).slice(0, 3);
  const correctAt = int(0, 3);
  const options = [...distractors];
  options.splice(correctAt, 0, topic);
  return [
    { id: "q1", type: "single", prompt: "Which of these is the topic of this assignment?", options, correct: [correctAt], points: 5 },
    {
      id: "q2",
      type: "multiple",
      prompt: "Tick every habit that helps you do your best work.",
      options: ["Reading the instructions first", "Checking my work before submitting", "Copying a friend's answers", "Rushing to finish quickly"],
      correct: [0, 1],
      points: 5,
    },
    { id: "q3", type: "text", prompt: instructions, options: [], correct: [], points: 10 },
  ];
}

const FLAGSHIP_QUESTIONS: Question[] = [
  { id: "q1", type: "single", prompt: "A pizza is cut into 8 equal slices and you eat 3. What fraction of the pizza is left?", options: ["3/8", "5/8", "8/3", "1/2"], correct: [1], points: 4 },
  { id: "q2", type: "multiple", prompt: "Tick all the fractions that are equal to one half.", options: ["2/4", "3/6", "2/3", "5/10"], correct: [0, 1, 3], points: 4 },
  { id: "q3", type: "single", prompt: "Which of these fractions is the largest?", options: ["1/4", "1/3", "1/2", "1/5"], correct: [2], points: 4 },
  { id: "q4", type: "text", prompt: "Explain how you would share 3 oranges equally among 4 children. How much does each child get?", options: [], correct: [], points: 8 },
];

const sumPoints = (qs: Question[]) => qs.reduce((n, q) => n + q.points, 0);

// Assignments, materials and quizzes run from Primary 1 upwards; the early years
// are assessed through observation rather than set work.
const TEACHING_CLASSES = classes.filter(
  (c) => c.levelId.startsWith("lvl-p") || c.levelId.startsWith("lvl-j"),
);
let assignmentCounter = 0;

for (const cls of TEACHING_CLASSES) {
  const levelSubjects = subjectsForLevel(cls.levelId);
  const count = cls.id === "cls-p4a" ? 6 : int(2, 4);
  for (let i = 0; i < count; i++) {
    const template = ASSIGNMENT_TEMPLATES.filter((t) => levelSubjects.some((s) => s.id === t.subjectId))[
      (assignmentCounter + i) % Math.max(1, ASSIGNMENT_TEMPLATES.filter((t) => levelSubjects.some((s) => s.id === t.subjectId)).length)
    ];
    if (!template) continue;
    assignmentCounter += 1;
    const offset = -int(1, 24);
    const publishedAt = addDays(DEMO_TODAY, offset);
    const dueDate = addDays(publishedAt, int(3, 8));
    const teacherId = teachingAssignments.get(`${cls.id}:${template.subjectId}`) ?? cls.classTeacherId;
    assignments.push({
      id: `asg-${String(assignmentCounter).padStart(4, "0")}`,
      title: template.title,
      topic: template.topic,
      description: `A ${template.topic.toLowerCase()} task for ${cls.name}. Work should be completed neatly and submitted before the deadline.`,
      instructions: template.instructions,
      classId: cls.id,
      subjectId: template.subjectId,
      teacherId,
      termId: ACTIVE_TERM_ID,
      publishedAt: iso(publishedAt),
      startDate: iso(publishedAt),
      dueDate: iso(dueDate),
      questions: demoQuestions(template.topic, template.instructions),
      maxScore: 20,
      status: "published",
      createdAt: iso(publishedAt),
    });
  }
}

// Guarantee the spec's headline assignment exists exactly as described.
const flagship: Assignment = {
  id: "asg-flagship",
  title: "Fractions Around Us",
  topic: "Fractions",
  description: "Pupils identify and work with fractions using everyday objects at home.",
  instructions: "Answer every question. Show your thinking in the written answer.",
  classId: "cls-p4a",
  subjectId: "sub-mth",
  teacherId: "tch-019",
  termId: ACTIVE_TERM_ID,
  publishedAt: "2026-09-01T08:00:00.000Z",
  startDate: "2026-09-01T08:00:00.000Z",
  dueDate: "2026-09-04T17:00:00.000Z",
  questions: FLAGSHIP_QUESTIONS,
  maxScore: sumPoints(FLAGSHIP_QUESTIONS),
  status: "published",
  createdAt: "2026-09-01T08:00:00.000Z",
};
assignments.unshift(flagship);

let submissionCounter = 0;

function autoMark(q: Question, selected: number[]): number {
  const want = [...q.correct].sort().join(",");
  return [...selected].sort().join(",") === want ? q.points : 0;
}

function demoAnswers(assignment: Assignment, graded: boolean, skill: number): QuestionAnswer[] {
  return assignment.questions.map((q) => {
    if (q.type === "text") {
      return {
        questionId: q.id,
        text: "I worked through this step by step and wrote my answer neatly.",
        awarded: graded ? Math.max(0, Math.round(q.points * (0.5 + skill * 0.5))) : undefined,
      };
    }
    const right = rng() < 0.4 + skill * 0.55;
    const selected = right
      ? [...q.correct]
      : q.type === "single"
        ? [(q.correct[0] + 1) % q.options.length]
        : [q.correct[0]];
    return { questionId: q.id, selected, awarded: autoMark(q, selected), autoMarked: true };
  });
}

for (const assignment of assignments) {
  const roster = studentsByClass.get(assignment.classId) ?? [];
  const overdue = new Date(assignment.dueDate) < DEMO_TODAY;
  for (const student of roster) {
    const roll = rng();
    // Pupils who never submitted simply have no submission record.
    const submitted = overdue ? roll < 0.88 : roll < 0.45;
    if (!submitted) continue;
    const graded = overdue && roll < 0.7;
    const answers = demoAnswers(assignment, graded, rng());
    const score = answers.reduce((n, a) => n + (a.awarded ?? 0), 0);

    submissionCounter += 1;
    submissions.push({
      id: `sub-${String(submissionCounter).padStart(5, "0")}`,
      assignmentId: assignment.id,
      studentId: student.id,
      status: graded ? "graded" : "submitted",
      answers,
      submittedAt: iso(addDays(new Date(assignment.dueDate), -int(0, 2))),
      score,
      grade: graded ? gradeFor((score / assignment.maxScore) * 100).grade : undefined,
      feedback: graded
        ? pick([
            "Well done. Your working is clear and easy to follow.",
            "Good effort. Read each question twice before you answer.",
            "Excellent presentation — keep it up.",
            "Neat work. Remember to explain every step next time.",
          ])
        : undefined,
      gradedAt: graded ? iso(addDays(new Date(assignment.dueDate), int(1, 4))) : undefined,
    });
  }
}

// The spec's demo submission for David Chukwu.
const davidAnswers: QuestionAnswer[] = [
  { questionId: "q1", selected: [1], awarded: 4, autoMarked: true },
  { questionId: "q2", selected: [0, 1, 3], awarded: 4, autoMarked: true },
  { questionId: "q3", selected: [2], awarded: 4, autoMarked: true },
  { questionId: "q4", text: "Cut each orange into 4 equal pieces. That makes 12 pieces, so each child gets 3 pieces, which is 3/4 of an orange.", awarded: 6 },
];
const davidIdx = submissions.findIndex((s) => s.assignmentId === "asg-flagship" && s.studentId === DEMO_STUDENT_ID);
const davidFlagship: Submission = {
  id: davidIdx >= 0 ? submissions[davidIdx].id : "sub-david",
  assignmentId: "asg-flagship",
  studentId: DEMO_STUDENT_ID,
  status: "graded",
  answers: davidAnswers,
  submittedAt: "2026-09-03T14:20:00.000Z",
  score: 18,
  grade: "A",
  feedback: "Excellent work, David. Your explanation for question 4 is right — next time also write the answer as a fraction.",
  gradedAt: "2026-09-05T10:00:00.000Z",
};
if (davidIdx >= 0) submissions[davidIdx] = davidFlagship;
else submissions.push(davidFlagship);

/* -------------------------------------------------------------------------- */
/* Attendance                                                                  */
/* -------------------------------------------------------------------------- */

const attendance: AttendanceRecord[] = [];
let attendanceCounter = 0;
const SCHOOL_DAYS = 15;
for (let d = SCHOOL_DAYS; d >= 0; d--) {
  const date = addDays(DEMO_TODAY, -d);
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) continue;
  for (const cls of classes) {
    const roster = studentsByClass.get(cls.id) ?? [];
    for (const student of roster) {
      const roll = rng();
      const status: AttendanceStatus = roll < 0.925 ? "present" : roll < 0.96 ? "late" : roll < 0.985 ? "absent" : "excused";
      attendanceCounter += 1;
      attendance.push({
        id: `att-${attendanceCounter}`,
        studentId: student.id,
        classId: cls.id,
        date: dayKey(date),
        status,
        note: status === "excused" ? "Medical appointment — note received from parent." : undefined,
        recordedBy: cls.classTeacherId,
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Results and report cards                                                    */
/* -------------------------------------------------------------------------- */

const results: ResultEntry[] = [];
const reportCards: ReportCard[] = [];
let resultCounter = 0;

const RESULT_TERMS = ["term-2025-2", "term-2025-3"];

for (const cls of classes) {
  const roster = studentsByClass.get(cls.id) ?? [];
  const levelSubjects = subjectsForLevel(cls.levelId).slice(0, 10);
  for (const termId of RESULT_TERMS) {
    const totals: { studentId: string; total: number }[] = [];
    for (const student of roster) {
      let sum = 0;
      for (const subject of levelSubjects) {
        const classwork = int(6, 10);
        const assignment = int(6, 10);
        const test = int(11, 20);
        const exam = int(33, 60);
        const ca = classwork + assignment + test;
        const total = Math.min(100, ca + exam);
        const { grade, remark } = gradeFor(total);
        resultCounter += 1;
        results.push({
          id: `res-${resultCounter}`,
          studentId: student.id,
          subjectId: subject.id,
          classId: cls.id,
          termId,
          ca,
          exam,
          total,
          grade,
          remark,
        });
        sum += total;
      }
      totals.push({ studentId: student.id, total: sum });
    }

    const ranked = [...totals].sort((a, b) => b.total - a.total);
    ranked.forEach((entry, idx) => {
      const average = levelSubjects.length ? entry.total / levelSubjects.length : 0;
      reportCards.push({
        id: `rc-${termId}-${entry.studentId}`,
        studentId: entry.studentId,
        termId,
        classId: cls.id,
        average: Math.round(average * 10) / 10,
        totalScore: entry.total,
        position: idx + 1,
        classSize: ranked.length,
        attendancePresent: int(52, 60),
        attendanceTotal: 61,
        conduct: CONDUCT_TRAITS.map((label) => ({ label, rating: int(3, 5) })),
        teacherComment:
          average >= 75
            ? "A consistently strong term. Keep up the excellent attitude to learning."
            : average >= 60
              ? "A good term with steady progress. More practice in written work will help."
              : "Improvement is showing. Continued support with reading at home is encouraged.",
        headteacherComment:
          average >= 75 ? "An excellent result. Well done." : "A promising result. Keep working hard.",
        promotionStatus: termId === "term-2025-3" ? "promoted" : "pending",
        publishedAt: termId === "term-2025-3" ? "2026-07-24T10:00:00.000Z" : "2026-04-03T10:00:00.000Z",
      });
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Fees, invoices and payments                                                 */
/* -------------------------------------------------------------------------- */

const invoices: Invoice[] = [];
const payments: Payment[] = [];
let invoiceCounter = 0;
let paymentCounter = 0;

for (const student of students) {
  const cls = classes.find((c) => c.id === student.classId);
  const band = FEE_STRUCTURE.find((b) => cls && b.levelIds.includes(cls.levelId)) ?? FEE_STRUCTURE[1];
  const lines = [...band.lines];
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const roll = rng();
  const amountPaid = roll < 0.62 ? total : roll < 0.85 ? Math.round(total * 0.5) : 0;
  invoiceCounter += 1;
  const invoice: Invoice = {
    id: `inv-${String(invoiceCounter).padStart(5, "0")}`,
    invoiceNo: `INV-2026-${String(invoiceCounter).padStart(5, "0")}`,
    studentId: student.id,
    termId: ACTIVE_TERM_ID,
    lines,
    total,
    amountPaid,
    status: amountPaid === total ? "paid" : amountPaid > 0 ? "part_paid" : "overdue",
    issuedAt: "2026-08-25T09:00:00.000Z",
    dueDate: "2026-09-21T23:59:00.000Z",
  };
  invoices.push(invoice);
  if (amountPaid > 0) {
    paymentCounter += 1;
    payments.push({
      id: `pay-${String(paymentCounter).padStart(5, "0")}`,
      reference: `EIA-PAY-${String(paymentCounter).padStart(6, "0")}`,
      invoiceId: invoice.id,
      studentId: student.id,
      amount: amountPaid,
      provider: pick(["bank_transfer", "cash"] as const),
      status: "successful",
      paidAt: iso(addDays(DEMO_TODAY, -int(3, 40))),
      verifiedAt: iso(addDays(DEMO_TODAY, -int(3, 40))),
      receiptNo: `RCP-2026-${String(paymentCounter).padStart(5, "0")}`,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Learning materials & quizzes                                                */
/* -------------------------------------------------------------------------- */

const materials: LearningMaterial[] = [];
let materialCounter = 0;
const MATERIAL_TITLES = [
  "Lesson Notes: Week 1–3",
  "Revision Worksheet",
  "Topic Summary Sheet",
  "Practice Questions",
  "Class Presentation Slides",
  "Reading List for the Term",
  "Video Lesson Recap",
  "Illustrated Vocabulary Cards",
];
for (const cls of TEACHING_CLASSES) {
  const levelSubjects = subjectsForLevel(cls.levelId);
  for (let i = 0; i < 4; i++) {
    materialCounter += 1;
    const subject = levelSubjects[(i * 3) % levelSubjects.length];
    const kind = pick(["note", "pdf", "worksheet", "video", "slides", "link"] as const);
    materials.push({
      id: `mat-${materialCounter}`,
      title: `${subject.name} — ${MATERIAL_TITLES[(materialCounter + i) % MATERIAL_TITLES.length]}`,
      description: `Supporting material for ${cls.name} covering the current ${subject.name} scheme of work.`,
      classId: cls.id,
      subjectId: subject.id,
      teacherId: teachingAssignments.get(`${cls.id}:${subject.id}`) ?? cls.classTeacherId,
      kind,
      url: "#",
      sizeBytes: int(150000, 6000000),
      uploadedAt: iso(addDays(DEMO_TODAY, -int(1, 30))),
      downloads: int(4, 120),
    });
  }
}

const quizzes: Quiz[] = [];
const quizAttempts: QuizAttempt[] = [];
const QUIZ_BANK: { subjectId: string; title: string; questions: { prompt: string; options: string[]; answer: string }[] }[] = [
  {
    subjectId: "sub-mth",
    title: "Fractions Quick Check",
    questions: [
      { prompt: "Which fraction is the largest?", options: ["1/2", "1/3", "1/4", "1/6"], answer: "1/2" },
      { prompt: "1/2 is the same as ...", options: ["2/4", "2/3", "3/4", "1/4"], answer: "2/4" },
      { prompt: "What is 1/4 of 20?", options: ["4", "5", "6", "10"], answer: "5" },
      { prompt: "Half of 18 is 9.", options: ["True", "False"], answer: "True" },
      { prompt: "Which is a proper fraction?", options: ["5/3", "3/5", "7/7", "9/4"], answer: "3/5" },
    ],
  },
  {
    subjectId: "sub-eng",
    title: "Parts of Speech Check",
    questions: [
      { prompt: "Which word is a noun?", options: ["quickly", "table", "run", "blue"], answer: "table" },
      { prompt: "Which word is a verb?", options: ["happy", "jump", "chair", "soft"], answer: "jump" },
      { prompt: "An adjective describes a noun.", options: ["True", "False"], answer: "True" },
      { prompt: "Which word is an adverb?", options: ["slowly", "book", "green", "she"], answer: "slowly" },
      { prompt: "Which word is a pronoun?", options: ["they", "walk", "bright", "school"], answer: "they" },
    ],
  },
  {
    subjectId: "sub-bsc",
    title: "Living Things Check",
    questions: [
      { prompt: "Which one is a living thing?", options: ["Stone", "Tree", "Chair", "Cup"], answer: "Tree" },
      { prompt: "Living things can grow.", options: ["True", "False"], answer: "True" },
      { prompt: "Plants make their food using ...", options: ["Sunlight", "Sand", "Plastic", "Metal"], answer: "Sunlight" },
      { prompt: "Which is NOT a sense organ?", options: ["Eye", "Ear", "Nose", "Pencil"], answer: "Pencil" },
      { prompt: "Fish breathe using gills.", options: ["True", "False"], answer: "True" },
    ],
  },
];

let quizCounter = 0;
for (const cls of TEACHING_CLASSES.slice(0, 10)) {
  for (const bank of QUIZ_BANK) {
    if (!subjectsForLevel(cls.levelId).some((s) => s.id === bank.subjectId)) continue;
    quizCounter += 1;
    quizzes.push({
      id: `qz-${quizCounter}`,
      title: `${bank.title} — ${cls.name}`,
      classId: cls.id,
      subjectId: bank.subjectId,
      teacherId: teachingAssignments.get(`${cls.id}:${bank.subjectId}`) ?? cls.classTeacherId,
      description: "A short check of understanding. You may take it once and see your result immediately.",
      durationMinutes: 10,
      attemptsAllowed: 1,
      randomize: true,
      showResultsImmediately: true,
      questions: bank.questions.map((q, i) => ({
        id: `qz-${quizCounter}-q${i + 1}`,
        type: q.options.length === 2 ? "true_false" : "multiple_choice",
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        points: 2,
      })),
      opensAt: iso(addDays(DEMO_TODAY, -7)),
      closesAt: iso(addDays(DEMO_TODAY, 14)),
      status: "published",
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Applications                                                                */
/* -------------------------------------------------------------------------- */

const APP_STATUSES: Application["status"][] = [
  "submitted", "under_review", "documents_required", "assessment_scheduled",
  "assessment_completed", "interview_scheduled", "accepted", "conditionally_accepted",
  "waitlisted", "not_accepted", "enrolled",
];

const applications: Application[] = [];
for (let i = 0; i < 34; i++) {
  const gender = chance(0.5) ? "Male" : "Female";
  const firstName = pick(gender === "Male" ? MALE_FIRST : FEMALE_FIRST);
  const lastName = pick(SURNAMES);
  const status = i === 0 ? "assessment_scheduled" : pick(APP_STATUSES);
  const levelId = pick(CLASS_LEVELS.map((l) => l.id));
  const createdAt = addDays(DEMO_TODAY, -int(4, 70));
  const guardianFirst = pick(chance(0.5) ? FEMALE_FIRST : MALE_FIRST);
  const email = i === 0 ? "applicant@example.com" : `${guardianFirst.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
  applications.push({
    id: `app-${String(i + 1).padStart(4, "0")}`,
    applicationNo: `ADM-2026-${String(400 + i + 1).padStart(5, "0")}`,
    sessionId: "ses-2026",
    intendedLevelId: levelId,
    status,
    createdAt: iso(createdAt),
    submittedAt: iso(addDays(createdAt, 1)),
    pupil: {
      firstName,
      middleName: "",
      lastName,
      dateOfBirth: `${2020 - int(0, 3)}-0${int(1, 9)}-1${int(0, 9)}`,
      gender,
      nationality: "Nigerian",
      previousSchool: chance(0.7) ? `${pick(["Bright", "Little", "Sunrise", "Grace"])} ${pick(["Steps", "Angels", "Minds", "Kids"])} School, Abuja` : "",
      currentClass: "",
      address: address(),
      photoUploaded: true,
    },
    guardian: {
      name: `${guardianFirst} ${lastName}`,
      relationship: chance(0.5) ? "Mother" : "Father",
      phone: phone(),
      email,
      occupation: pick(OCCUPATIONS),
      address: address(),
      emergencyContact: `${pick(MALE_FIRST)} ${lastName}`,
      emergencyPhone: phone(),
    },
    documents: APPLICATION_DOCUMENT_REQUIREMENTS.map((d) => ({
      key: d.key,
      label: d.label,
      required: d.required,
      uploaded: status === "documents_required" ? !d.required || chance(0.5) : d.required || chance(0.5),
      fileName: `${d.key}.pdf`,
      uploadedAt: iso(addDays(createdAt, 1)),
    })),
    applicationFeePaid: status !== "draft",
    applicationFeeReference: `EIA-ADM-${String(1000 + i)}`,
    assessment:
      ["assessment_scheduled", "assessment_completed", "interview_scheduled", "accepted", "enrolled", "conditionally_accepted"].includes(status)
        ? { date: dayKey(addDays(DEMO_TODAY, int(2, 18))), time: pick(["09:00", "10:00", "11:00"]), venue: "Assessment Hall, Main Block", score: status === "assessment_completed" ? int(58, 94) : undefined }
        : undefined,
    interview:
      ["interview_scheduled", "accepted", "enrolled"].includes(status)
        ? { date: dayKey(addDays(DEMO_TODAY, int(4, 22))), time: "12:00", venue: "Headteacher's Office" }
        : undefined,
    decisionNote:
      status === "accepted" || status === "enrolled"
        ? "We are delighted to offer your child a place for the 2026/2027 session."
        : status === "not_accepted"
          ? "We are unable to offer a place in this class for the current session."
          : status === "waitlisted"
            ? "Your child has been placed on the waiting list for this class."
            : undefined,
    timeline: [
      { at: iso(createdAt), status: "draft", note: "Application started.", actor: "Parent" },
      { at: iso(addDays(createdAt, 1)), status: "submitted", note: "Application submitted for review.", actor: "Parent" },
      { at: iso(addDays(createdAt, 2)), status: "under_review", note: "Admissions team began review.", actor: "Admissions Office" },
    ],
    ownerEmail: email,
  });
}

/* -------------------------------------------------------------------------- */
/* Public content                                                              */
/* -------------------------------------------------------------------------- */

const TONES = ["navy", "gold", "info", "success", "plum"];

const news: NewsPost[] = [
  {
    id: "nws-1", slug: "welcome-back-2026-2027",
    title: "Welcome Back to a New Academic Session",
    excerpt: "We are delighted to welcome our returning pupils and new members of the El-Bethel family to the 2026/2027 session.",
    content:
      "Welcome to the 2026/2027 academic session at El-Bethel International Academy.\n\nWe are delighted to welcome our returning pupils and new members of the El-Bethel family. We look forward to another exciting year of learning, discovery, friendship and achievement.\n\nThis term brings a refreshed reading programme, an expanded robotics offering in the ICT and Innovation Lab, and a full calendar of sporting and cultural events. Our teachers have spent the vacation preparing classrooms, schemes of work and learning resources so that every child settles quickly into the rhythm of the term.\n\nParents can follow their child's assignments, attendance and results in the Parent Portal from the first week of term.",
    category: "Announcements", tags: ["session", "resumption"], authorName: "Dr. Amaka N. Okafor",
    publishedAt: "2026-09-01T08:00:00.000Z", status: "published", tone: "navy",
    seoTitle: "Welcome Back to a New Academic Session | El-Bethel International Academy",
    seoDescription: "El-Bethel International Academy welcomes pupils and parents to the 2026/2027 academic session in Abuja.",
    featured: true,
  },
  {
    id: "nws-2", slug: "robotics-club-regional-finals",
    title: "Robotics Club Reaches Regional Finals",
    excerpt: "Our Primary 5 and 6 robotics team placed second at the FCT primary schools challenge and will represent Abuja at the regional finals.",
    content:
      "Our Robotics Club has done it again. Competing against fourteen primary schools across the Federal Capital Territory, our Primary 5 and 6 team placed second in the line-following and obstacle challenge categories.\n\nThe team spent eight weeks preparing after school, designing, testing and rebuilding their robot. Mr. Michael Nwosu, who coordinates the club, praised the pupils' persistence: 'They failed sixteen times before the design worked. That is the real lesson.'\n\nThe team now advances to the regional finals in November.",
    category: "Achievements", tags: ["robotics", "stem", "competition"], authorName: "Mr. Michael Nwosu",
    publishedAt: "2026-09-18T10:00:00.000Z", status: "published", tone: "info",
    seoTitle: "Robotics Club Reaches Regional Finals | El-Bethel International Academy",
    seoDescription: "El-Bethel International Academy's robotics team placed second at the FCT primary schools challenge.",
    featured: true,
  },
  {
    id: "nws-3", slug: "reading-challenge-2026",
    title: "The El-Bethel Reading Challenge Returns",
    excerpt: "Every pupil is invited to read twenty books this term, with celebration assemblies for readers who reach the milestone.",
    content:
      "Reading is at the heart of everything a child learns, and our termly reading challenge is back.\n\nEach pupil receives a reading passport. Twenty completed books earns a place at our end-of-term celebration assembly, and every class that reaches an eighty percent participation rate wins an additional library session each week.\n\nParents can support by setting aside fifteen minutes of reading together every evening.",
    category: "Academics", tags: ["reading", "library"], authorName: "Mrs. Esther Bello",
    publishedAt: "2026-09-14T09:00:00.000Z", status: "published", tone: "gold",
    seoTitle: "The El-Bethel Reading Challenge Returns", seoDescription: "Our termly reading challenge encourages every pupil to read twenty books.",
    featured: false,
  },
  {
    id: "nws-4", slug: "new-science-laboratory-opens",
    title: "New Science Laboratory Opens for Upper Primary",
    excerpt: "A refurbished, child-safe laboratory gives Primary 4 to 6 pupils weekly hands-on practical sessions.",
    content:
      "Our refurbished science laboratory opened this month, giving upper primary pupils a dedicated space for weekly practical work.\n\nThe laboratory has been designed specifically for young learners: lower benches, sealed storage, child-safe equipment and clear safety signage. Every practical session is supervised and risk-assessed.\n\n'Children remember what they do far better than what they are told,' said Mr. David Musa, who leads Basic Science in upper primary.",
    category: "Facilities", tags: ["science", "facilities"], authorName: "Mr. David Musa",
    publishedAt: "2026-09-10T11:00:00.000Z", status: "published", tone: "success",
    seoTitle: "New Science Laboratory Opens", seoDescription: "A refurbished child-safe science laboratory for upper primary pupils.",
    featured: false,
  },
  {
    id: "nws-5", slug: "inter-house-sports-preparations",
    title: "Preparations Begin for Inter-House Sports",
    excerpt: "Emerald, Sapphire, Ruby and Amber houses begin training ahead of the October sports festival.",
    content:
      "Training has begun ahead of our Inter-House Sports Festival on 17 October.\n\nAll four houses — Emerald, Sapphire, Ruby and Amber — hold practice sessions twice a week. Events include sprints, relays, long jump, sack races and the always-popular parents' race.\n\nParents are warmly invited. Gates open at 8:00 AM and the opening march past begins at 9:00 AM.",
    category: "Sports", tags: ["sports", "inter-house"], authorName: "Mr. Tunde Balogun",
    publishedAt: "2026-09-22T08:30:00.000Z", status: "published", tone: "gold",
    seoTitle: "Preparations Begin for Inter-House Sports", seoDescription: "El-Bethel houses train for the annual sports festival in Abuja.",
    featured: true,
  },
  {
    id: "nws-6", slug: "parents-welcome-meeting-recap",
    title: "A Full House at the Parents' Welcome Meeting",
    excerpt: "Over three hundred parents joined us to meet class teachers and review the term ahead.",
    content:
      "Our Parents' Welcome Meeting brought more than three hundred families to the school auditorium.\n\nThe Headteacher outlined priorities for the session, class teachers presented their schemes of work, and parents toured classrooms and the new science laboratory.\n\nSlides from the meeting are available in the Parent Portal under School Documents.",
    category: "Community", tags: ["parents", "pta"], authorName: "Dr. Amaka N. Okafor",
    publishedAt: "2026-09-13T16:00:00.000Z", status: "published", tone: "navy",
    seoTitle: "A Full House at the Parents' Welcome Meeting", seoDescription: "Three hundred families joined our welcome meeting for the new session.",
    featured: false,
  },
  {
    id: "nws-7", slug: "safeguarding-refresher-training",
    title: "All Staff Complete Safeguarding Refresher Training",
    excerpt: "Every member of staff has completed the annual child protection and safeguarding refresher.",
    content:
      "Child safety is not an annual event; it is a daily practice. This month every member of teaching and non-teaching staff completed our safeguarding refresher.\n\nThe programme covered recognising and reporting concerns, safe supervision, online safety and our release policy. Our safeguarding lead is available to parents by appointment throughout the term.",
    category: "Safeguarding", tags: ["safety", "staff"], authorName: "Mrs. Zainab Lawal",
    publishedAt: "2026-09-08T09:00:00.000Z", status: "published", tone: "info",
    seoTitle: "Staff Complete Safeguarding Refresher Training", seoDescription: "Annual child protection and safeguarding training completed by all staff.",
    featured: false,
  },
  {
    id: "nws-8", slug: "french-club-cultural-morning",
    title: "French Club Hosts a Cultural Morning",
    excerpt: "Pupils presented songs, greetings and a market role-play entirely in French.",
    content:
      "Our French Club transformed the hall into a Francophone market square for a morning of songs, greetings and role-play.\n\nEvery pupil in the club spoke at least three complete sentences in French. Madame Adaobi Ojo, who coordinates the club, said the morning was 'a celebration of courage as much as language'.",
    category: "Languages", tags: ["french", "clubs"], authorName: "Mme. Adaobi Ojo",
    publishedAt: "2026-09-20T12:00:00.000Z", status: "published", tone: "plum",
    seoTitle: "French Club Hosts a Cultural Morning", seoDescription: "Pupils presented songs and role-play in French at El-Bethel International Academy.",
    featured: false,
  },
  {
    id: "nws-9", slug: "digital-report-cards-launch",
    title: "Digital Report Cards Launch This Term",
    excerpt: "Parents will receive termly report cards directly in the Parent Portal, with downloadable PDFs.",
    content:
      "From this term, report cards are published to the Parent Portal on the result publication date.\n\nEach report card includes subject-by-subject continuous assessment and examination scores, attendance, conduct ratings, the class teacher's comment and the Headteacher's comment. A printable version is available to download.\n\nPrinted copies remain available on request from the school office.",
    category: "Academics", tags: ["results", "portal"], authorName: "Mr. Ifeanyi Adeyemi",
    publishedAt: "2026-09-16T10:00:00.000Z", status: "published", tone: "success",
    seoTitle: "Digital Report Cards Launch", seoDescription: "Termly report cards are now published in the El-Bethel Parent Portal.",
    featured: false,
  },
  {
    id: "nws-11", slug: "art-exhibition-preview",
    title: "Young Artists Prepare for the Termly Exhibition",
    excerpt: "Work from every class will be displayed in the Creative Arts Studio at the end of term.",
    content:
      "The Creative Arts Studio is filling up with colour as pupils prepare for our end-of-term exhibition.\n\nEvery class contributes work, and this term's theme is 'My Abuja'. Parents are invited to view the exhibition during the First Term Open Day.",
    category: "Arts", tags: ["arts", "exhibition"], authorName: "Miss Favour Okeke",
    publishedAt: "2026-09-24T14:00:00.000Z", status: "published", tone: "plum",
    seoTitle: "Young Artists Prepare for the Termly Exhibition", seoDescription: "Pupil artwork on the theme 'My Abuja' will be exhibited at Open Day.",
    featured: false,
  },
  {
    id: "nws-12", slug: "nutrition-and-lunch-menu",
    title: "This Term's Lunch Menu Is Now Published",
    excerpt: "Our termly menu, allergy notes and nutrition guidance are available to all parents.",
    content:
      "Our kitchen has published the lunch menu for the first term, together with allergy notes and guidance from our school nurse.\n\nMeals rotate on a three-week cycle and always include a vegetable and a fruit portion. Parents whose children have dietary requirements should contact the school office so that we can plan accordingly.",
    category: "Wellbeing", tags: ["nutrition", "cafeteria"], authorName: "School Administration",
    publishedAt: "2026-09-11T09:30:00.000Z", status: "published", tone: "gold",
    seoTitle: "This Term's Lunch Menu Is Now Published", seoDescription: "Termly lunch menu, allergy notes and nutrition guidance for parents.",
    featured: false,
  },
];

const AUTO_NEWS_TITLES = [
  "Primary 3 Visits the National Children's Library",
  "Chess Club Launches a Lunchtime Ladder",
  "Handwriting Champions Announced",
  "Our Gardening Club Harvests Its First Crop",
  "Mathematics Week: Puzzles Across the School",
  "Primary 1 Pupils Celebrate Colour Day",
  "Debate Club Wins the Inter-School Friendly",
  "New Books Added to the School Library",
];
AUTO_NEWS_TITLES.forEach((title, i) => {
  news.push({
    id: `nws-${13 + i}`,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title,
    excerpt: `${title} — a short update from life at El-Bethel International Academy this term.`,
    content: `${title}.\n\nLife at El-Bethel International Academy is busy, and this is one of the many moments worth sharing from the term so far. Our pupils continue to surprise us with their curiosity, effort and kindness.\n\nMore photographs from this event are available in the school gallery.`,
    category: pick(["School Life", "Academics", "Clubs", "Community"]),
    tags: ["school life"],
    authorName: "School Administration",
    publishedAt: iso(addDays(DEMO_TODAY, -int(2, 40))),
    status: "published",
    tone: TONES[i % TONES.length],
    seoTitle: `${title} | El-Bethel International Academy`,
    seoDescription: `${title} at El-Bethel International Academy, Abuja.`,
    featured: false,
  });
});

const events: SchoolEvent[] = [
  { id: "evt-1", slug: "resumption-day", title: "Resumption Day", description: "First day of the 2026/2027 academic session. Pupils resume in full school uniform.", date: "2026-09-07", startTime: "07:30", endTime: "14:30", venue: "Main Campus", category: "academic", requiresRegistration: false, status: "past" },
  { id: "evt-2", slug: "parents-welcome-meeting", title: "Parents' Welcome Meeting", description: "Meet your child's class teacher, review the term ahead and tour the campus.", date: "2026-09-12", startTime: "09:00", endTime: "12:00", venue: "School Auditorium", category: "parents", requiresRegistration: true, status: "past" },
  { id: "evt-3", slug: "inter-house-sports", title: "Inter-House Sports Festival", description: "Our annual sports festival featuring track events, field events and the parents' race.", date: "2026-10-17", startTime: "08:00", endTime: "14:00", venue: "El-Bethel International Sports Field", category: "sports", requiresRegistration: true, status: "upcoming" },
  { id: "evt-4", slug: "cultural-day", title: "Cultural Day", description: "A celebration of Nigeria's cultures through dress, food, music and drama.", date: "2026-11-21", startTime: "09:00", endTime: "13:00", venue: "School Auditorium", category: "cultural", requiresRegistration: true, status: "upcoming" },
  { id: "evt-5", slug: "first-term-open-day", title: "First Term Open Day", description: "View your child's work, meet subject teachers and see the termly art exhibition.", date: "2026-12-04", startTime: "09:00", endTime: "15:00", venue: "Main Campus", category: "parents", requiresRegistration: false, status: "upcoming" },
  { id: "evt-6", slug: "first-term-examinations", title: "First Term Examinations", description: "End-of-term examinations for Primary 1 to Primary 6.", date: "2026-12-07", endDate: "2026-12-16", startTime: "08:00", endTime: "12:30", venue: "Classrooms", category: "assessment", requiresRegistration: false, status: "upcoming" },
  { id: "evt-7", slug: "pta-general-meeting", title: "PTA General Meeting", description: "Termly meeting of the Parent-Teacher Association.", date: "2026-10-10", startTime: "10:00", endTime: "12:00", venue: "School Auditorium", category: "parents", requiresRegistration: false, status: "upcoming" },
  { id: "evt-8", slug: "science-and-innovation-fair", title: "Science & Innovation Fair", description: "Pupils exhibit science projects and robotics builds from across the term.", date: "2026-11-07", startTime: "09:00", endTime: "13:00", venue: "ICT & Innovation Lab", category: "academic", requiresRegistration: false, status: "upcoming" },
  { id: "evt-9", slug: "excursion-to-national-museum", title: "Primary 4–6 Excursion", description: "An educational excursion to the National Museum, Abuja.", date: "2026-10-30", startTime: "08:00", endTime: "15:00", venue: "National Museum, Abuja", category: "academic", requiresRegistration: true, status: "upcoming" },
  { id: "evt-10", slug: "christmas-carol-service", title: "Christmas Carol Service", description: "Our end-of-term carol service and nativity performance.", date: "2026-12-17", startTime: "10:00", endTime: "12:00", venue: "School Auditorium", category: "cultural", requiresRegistration: false, status: "upcoming" },
  { id: "evt-11", slug: "mid-term-break", title: "Mid-Term Break", description: "School closed for the first-term mid-term break.", date: "2026-10-26", endDate: "2026-10-28", startTime: "00:00", endTime: "23:59", venue: "—", category: "holiday", requiresRegistration: false, status: "upcoming" },
  { id: "evt-12", slug: "end-of-term-closing", title: "End of First Term", description: "Closing ceremony and collection of report cards.", date: "2026-12-18", startTime: "09:00", endTime: "12:00", venue: "School Auditorium", category: "academic", requiresRegistration: false, status: "upcoming" },
];

const GALLERY_CATEGORIES = ["Classrooms", "Sports", "Excursions", "Cultural Events", "Graduation", "Science", "Arts", "School Facilities"];
const GALLERY_TITLES = [
  "Morning assembly on the front lawn", "Reading corner in Primary 2B", "Sack race at the sports festival",
  "Building bridges in the innovation lab", "Cultural day drumming circle", "Primary 6 graduation caps",
  "Growing beans in the gardening club", "Painting the school mural", "Field trip to the science centre",
  "Relay handover at inter-house sports", "Library story session", "Robotics team at work",
  "Basketball coaching session", "Colour day in lower primary", "Our new science laboratory",
  "Choir rehearsal in the auditorium", "Primary 5 debate finals", "Handwriting champions",
  "Football academy training", "Art exhibition preview", "Lunch in the cafeteria",
  "Learning to code with block editors", "Chess ladder in the library", "French club market role-play",
  "Planting day in the school garden", "Interactive whiteboard lesson", "Playground fun at break time",
  "Prize-giving day", "Parents' race", "Science fair volcano project",
  "Musical instruments workshop", "Class photo — Primary 4A",
];
const gallery: GalleryItem[] = GALLERY_TITLES.map((title, i) => ({
  id: `gal-${i + 1}`,
  title,
  caption: title,
  category: GALLERY_CATEGORIES[i % GALLERY_CATEGORIES.length],
  takenAt: iso(addDays(DEMO_TODAY, -int(5, 300))),
  consentCleared: true,
  tone: TONES[i % TONES.length],
}));

const CLUB_DEFS: { name: string; category: Club["category"]; description: string }[] = [
  { name: "Coding Club", category: "stem", description: "Block-based and beginner text coding, games and simple apps." },
  { name: "Young Scientists Club", category: "stem", description: "Weekly experiments, nature study and science fair preparation." },
  { name: "Chess Club", category: "literary", description: "Strategy, patience and a friendly lunchtime ladder." },
  { name: "Reading Club", category: "literary", description: "Shared reading, book talks and our termly reading challenge." },
  { name: "Art Club", category: "arts", description: "Drawing, painting, printmaking and the termly exhibition." },
  { name: "Music Club", category: "arts", description: "Voice, recorder, percussion and the school choir." },
  { name: "Drama Club", category: "arts", description: "Improvisation, script work and end-of-term performances." },
  { name: "Football Academy", category: "sports", description: "Skills, fitness and inter-school fixtures." },
  { name: "Basketball Club", category: "sports", description: "Coached sessions for Primary 3 to Primary 6." },
  { name: "Dance Club", category: "arts", description: "Traditional and contemporary dance for all ages." },
  { name: "Debate Club", category: "literary", description: "Speaking with confidence, listening with respect." },
  { name: "Robotics Club", category: "stem", description: "Design, build and program robots for regional challenges." },
  { name: "Gardening Club", category: "service", description: "Growing vegetables and caring for the school grounds." },
  { name: "French Club", category: "literary", description: "Conversation, songs and Francophone culture." },
  { name: "Creative Writing Club", category: "literary", description: "Stories, poems and our pupil-run school magazine." },
  { name: "Young Entrepreneurs Club", category: "service", description: "Ideas, savings and our annual market day stall." },
];
const clubs: Club[] = CLUB_DEFS.map((c, i) => ({
  id: `club-${i + 1}`,
  slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name: c.name,
  description: c.description,
  coordinatorId: teachers[(i + 3) % teachers.length].id,
  meetingDay: pick(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  meetingTime: pick(["13:10", "14:30", "15:00"]),
  memberCount: int(14, 48),
  category: c.category,
}));

const ACHIEVEMENT_DEFS: { category: Achievement["category"]; title: string; description: string }[] = [
  { category: "Academic Excellence", title: "Top of Primary 6 — Third Term", description: "Achieved the highest overall average in the year group." },
  { category: "STEM", title: "Second Place, FCT Robotics Challenge", description: "Placed second in the line-following and obstacle categories." },
  { category: "Reading", title: "50 Books in One Term", description: "Completed fifty books in the El-Bethel Reading Challenge." },
  { category: "Sports", title: "Fastest 100m, Inter-House Sports", description: "Set a new school record in the Primary 5 sprint." },
  { category: "Music", title: "Best Solo Performance", description: "Performed at the end-of-year concert to a standing ovation." },
  { category: "Arts", title: "Exhibition Prize, 'My Abuja'", description: "Selected as the standout piece in the termly art exhibition." },
  { category: "Competitions", title: "Winner, Inter-School Spelling Bee", description: "Won the FCT primary spelling bee final." },
  { category: "Leadership", title: "Head Boy, 2026/2027", description: "Elected by peers and staff to lead the pupil council." },
  { category: "Community Service", title: "Gardening Club Harvest Donation", description: "Led the donation of the club's first harvest to a local shelter." },
  { category: "Academic Excellence", title: "Mathematics Olympiad Finalist", description: "Reached the national finals of the primary mathematics olympiad." },
  { category: "Sports", title: "Most Improved Footballer", description: "Recognised for outstanding progress across the season." },
  { category: "Reading", title: "Class Reading Champion", description: "Highest reading participation in Primary 3." },
];
const achievements: Achievement[] = ACHIEVEMENT_DEFS.map((a, i) => ({
  id: `ach-${i + 1}`,
  studentInitials: `${pick(MALE_FIRST)[0]}. ${pick(SURNAMES)[0]}.`,
  classLabel: pick(["Primary 3", "Primary 4", "Primary 5", "Primary 6"]),
  category: a.category,
  title: a.title,
  description: a.description,
  date: iso(addDays(DEMO_TODAY, -int(20, 300))),
}));

const testimonials: Testimonial[] = [
  { id: "tst-1", name: "Mrs. Aisha Bello", relationship: "Parent, Primary 3", quote: "El-Bethel International has given my daughter the confidence to express herself and the academic foundation she needs. The teachers are attentive and genuinely care about the children.", avatarSeed: "AishaBello" },
  { id: "tst-2", name: "Mr. Emeka Okafor", relationship: "Parent, Primary 5", quote: "What impressed us most was the partnership between the school and parents. We always know what our son is learning and how he is progressing.", avatarSeed: "EmekaOkafor" },
  { id: "tst-3", name: "Mrs. Grace Ibrahim", relationship: "Parent, Primary 1 & Primary 4", quote: "The combination of academics, technology, sports and creative activities makes El-Bethel a wonderful environment for children.", avatarSeed: "GraceIbrahim" },
];

const FAQ_DEFS: { category: string; question: string; answer: string }[] = [
  { category: "Admissions", question: "When does admission open for the 2026/2027 session?", answer: "Admission for the 2026/2027 session is currently OPEN for every class — Creche, Pre-School, Nursery 1 to Nursery 3, Primary 1 to Primary 6 and JSS 1 to JSS 3. Limited spaces are available in some classes, so early application is encouraged." },
  { category: "Admissions", question: "How do I apply?", answer: "Create a parent account, complete the online application form, pay the application fee and submit. You will receive an application number to track your progress. Bring the required documents with you to the screening — nothing is uploaded online." },
  { category: "Admissions", question: "Is there an entrance assessment?", answer: "Yes, from Nursery 1 upwards. All applicants take a short, age-appropriate assessment: a gentle readiness activity in the nursery and early primary years, and written English and mathematics papers for Primary 4 and above. Creche and Pre-School places need only a settling visit." },
  { category: "Admissions", question: "What documents are required?", answer: "A birth certificate or declaration of age, a passport photograph, medical information and parent identification are required. A previous school report and transfer document are needed where applicable." },
  { category: "Fees", question: "What are the school fees?", answer: "Fees range from ₦248,000 per term in Creche and Pre-School to ₦460,000 per term in JSS 1 to 3, covering tuition, learning resources, activities and technology. Meals are an optional extra." },
  { category: "Fees", question: "Can fees be paid in instalments?", answer: "Yes. Please contact the school accountant before the start of term to agree a payment plan. Payment records and receipts are always available in the Parent Portal." },
  { category: "Fees", question: "How do I get a receipt?", answer: "Receipts are issued by the school bursary once a payment is confirmed, and every payment recorded appears in the Parent Portal." },
  { category: "Classes", question: "How large are your classes?", answer: "Our average class size is 24 pupils, with a pupil-to-teacher ratio of 12:1. Every class also has a class teacher who knows each child personally." },
  { category: "Classes", question: "How are pupils placed in sections?", answer: "Pupils are placed to create balanced sections. Siblings and friendship groups are considered where it supports a child's settling in." },
  { category: "Uniform", question: "What is the school uniform?", answer: "Pupils wear the El-Bethel day uniform Monday to Thursday and the house sports kit on Fridays. Full details and suppliers are in the Uniform Guide document." },
  { category: "Academics", question: "What curriculum do you follow?", answer: "We follow the Nigerian national curriculum, enriched with a child-centred, activity-based approach and a strong emphasis on reading, reasoning and digital literacy." },
  { category: "Academics", question: "How is my child assessed?", answer: "Assessment is continuous. Classwork, assignments and tests make up the continuous assessment, and the end-of-term examination makes up the rest of the 100-mark subject score. The usual split is 40 percent CA and 60 percent exam, but each subject teacher sets the exact weighting for the term, and the report card shows what each score was marked out of." },
  { category: "Assignments", question: "How does my child submit assignments?", answer: "Pupils can type an answer or photograph completed work in their exercise book and upload it in the Pupil Portal. Files up to 5 MB in JPG, PNG, WEBP, PDF or DOCX are accepted." },
  { category: "Assignments", question: "What if my child misses a deadline?", answer: "Late submissions are still accepted and clearly marked. Teachers may request a resubmission where work is incomplete." },
  { category: "Parents", question: "How do I contact my child's teacher?", answer: "Use the Messages section of the Parent Portal to contact your child's class teacher or an authorised subject teacher. You can also book a parent-teacher meeting slot." },
  { category: "Parents", question: "Can I follow more than one child from one account?", answer: "Yes. A single parent account supports multiple children, and you can switch between them anywhere in the portal." },
  { category: "School Calendar", question: "When does the term start and end?", answer: "First Term runs 7 September to 18 December 2026, Second Term 11 January to 2 April 2027, and Third Term 19 April to 23 July 2027." },
  { category: "School Calendar", question: "When are report cards published?", answer: "Report cards are published in the Parent Portal on the result publication date at the end of each term." },
];
const faqs: FaqItem[] = FAQ_DEFS.map((f, i) => ({ id: `faq-${i + 1}`, ...f }));

const documents: SchoolDocument[] = [
  { id: "doc-1", title: "School Handbook 2026/2027", description: "Everything an El-Bethel family needs to know about the school year.", fileName: "elbethel-handbook-2026-2027.pdf", sizeBytes: 2_845_331, visibility: "public", updatedAt: "2026-08-20T09:00:00.000Z", category: "General" },
  { id: "doc-2", title: "Prospectus", description: "An introduction to our school, curriculum and facilities.", fileName: "elbethel-prospectus.pdf", sizeBytes: 5_120_004, visibility: "public", updatedAt: "2026-07-30T09:00:00.000Z", category: "Admissions" },
  { id: "doc-3", title: "Fee Schedule 2026/2027", description: "Termly fees by class band, including optional services.", fileName: "fee-schedule-2026-2027.pdf", sizeBytes: 412_889, visibility: "public", updatedAt: "2026-08-01T09:00:00.000Z", category: "Fees" },
  { id: "doc-4", title: "Academic Calendar 2026/2027", description: "Term dates, breaks, examinations and key events.", fileName: "academic-calendar-2026-2027.pdf", sizeBytes: 318_220, visibility: "public", updatedAt: "2026-08-05T09:00:00.000Z", category: "Academics" },
  { id: "doc-5", title: "Uniform Guide", description: "Day uniform, sports kit and approved suppliers.", fileName: "uniform-guide.pdf", sizeBytes: 1_204_338, visibility: "public", updatedAt: "2026-07-15T09:00:00.000Z", category: "General" },
  { id: "doc-6", title: "Admission Requirements", description: "Documents and steps required for a complete application.", fileName: "admission-requirements.pdf", sizeBytes: 265_112, visibility: "public", updatedAt: "2026-08-02T09:00:00.000Z", category: "Admissions" },
  { id: "doc-7", title: "Parent Handbook", description: "Policies, communication channels and how to support learning at home.", fileName: "parent-handbook.pdf", sizeBytes: 1_884_002, visibility: "parents", updatedAt: "2026-08-22T09:00:00.000Z", category: "Parents" },
  { id: "doc-8", title: "Safeguarding & Child Protection Policy", description: "Our approach to keeping every child safe.", fileName: "safeguarding-policy.pdf", sizeBytes: 702_441, visibility: "parents", updatedAt: "2026-08-18T09:00:00.000Z", category: "Policies" },
  { id: "doc-9", title: "Staff Code of Conduct", description: "Professional standards expected of all staff.", fileName: "staff-code-of-conduct.pdf", sizeBytes: 512_009, visibility: "staff", updatedAt: "2026-08-10T09:00:00.000Z", category: "Policies" },
  { id: "doc-10", title: "Termly Lunch Menu", description: "Three-week rotating menu with allergy notes.", fileName: "lunch-menu-first-term.pdf", sizeBytes: 224_118, visibility: "parents", updatedAt: "2026-09-11T09:00:00.000Z", category: "Wellbeing" },
];

const vacancies: Vacancy[] = [
  {
    id: "vac-1", slug: "upper-primary-mathematics-teacher", title: "Upper Primary Mathematics Teacher",
    department: "Mathematics", type: "Full-time", location: "Ushafa, Abuja",
    summary: "Teach mathematics across Primary 4 to 6 with a focus on reasoning and problem solving.",
    responsibilities: ["Plan and deliver engaging mathematics lessons", "Assess and report on pupil progress", "Contribute to the mathematics scheme of work", "Support the mathematics olympiad team"],
    requirements: ["B.Ed or B.Sc with PGDE", "Minimum of three years primary teaching experience", "Strong classroom management", "Comfortable with digital learning tools"],
    closingDate: "2026-10-31", status: "open",
  },
  {
    id: "vac-2", slug: "lower-primary-assistant-teacher", title: "Lower Primary Assistant Teacher",
    department: "Lower Primary", type: "Full-time", location: "Ushafa, Abuja",
    summary: "Support the class teacher in a lower primary classroom with warmth, patience and energy.",
    responsibilities: ["Support daily classroom routines", "Prepare learning materials", "Supervise play and transitions", "Communicate observations to the class teacher"],
    requirements: ["NCE or B.Ed in primary education", "Experience with children aged 5 to 9", "Excellent interpersonal skills"],
    closingDate: "2026-11-15", status: "open",
  },
  {
    id: "vac-3", slug: "school-nurse", title: "School Nurse",
    department: "Wellbeing", type: "Full-time", location: "Ushafa, Abuja",
    summary: "Lead our medical centre and support the health and wellbeing of every pupil.",
    responsibilities: ["Provide first aid and daily medical support", "Maintain accurate medication and health records", "Run health screening and awareness sessions", "Liaise with parents on health matters"],
    requirements: ["Registered nurse with a valid practising licence", "Paediatric experience preferred", "Excellent record keeping"],
    closingDate: "2026-10-20", status: "open",
  },
  {
    id: "vac-4", slug: "ict-support-officer", title: "ICT Support Officer",
    department: "Technology", type: "Contract", location: "Ushafa, Abuja",
    summary: "Keep our classrooms, lab and school platform running smoothly.",
    responsibilities: ["Maintain classroom and lab hardware", "Support staff with the school platform", "Manage network and device security", "Assist with robotics club sessions"],
    requirements: ["Diploma or degree in a computing field", "Hands-on hardware and networking experience", "Patience working with children and staff"],
    closingDate: "2026-11-30", status: "open",
  },
];

const books: Book[] = [
  { id: "bk-1", title: "The Very Hungry Caterpillar", author: "Eric Carle", isbn: "9780241003008", category: "Picture Book", copiesTotal: 8, copiesAvailable: 5, ageRange: "3-6" },
  { id: "bk-2", title: "Chike and the River", author: "Chinua Achebe", isbn: "9780307473868", category: "Fiction", copiesTotal: 12, copiesAvailable: 7, ageRange: "8-12" },
  { id: "bk-3", title: "The Drum", author: "Chinua Achebe", isbn: "9789782081100", category: "Folktale", copiesTotal: 10, copiesAvailable: 10, ageRange: "6-9" },
  { id: "bk-4", title: "Charlotte's Web", author: "E. B. White", isbn: "9780064400558", category: "Fiction", copiesTotal: 10, copiesAvailable: 4, ageRange: "8-11" },
  { id: "bk-5", title: "Matilda", author: "Roald Dahl", isbn: "9780141365466", category: "Fiction", copiesTotal: 14, copiesAvailable: 9, ageRange: "8-12" },
  { id: "bk-6", title: "Sugar Girl", author: "Kola Onadipe", isbn: "9789781561269", category: "Fiction", copiesTotal: 9, copiesAvailable: 6, ageRange: "8-12" },
  { id: "bk-7", title: "My First Atlas", author: "DK", isbn: "9780241343593", category: "Reference", copiesTotal: 6, copiesAvailable: 6, ageRange: "6-10" },
  { id: "bk-8", title: "The Magic Tree House: Dinosaurs Before Dark", author: "Mary Pope Osborne", isbn: "9780679824114", category: "Adventure", copiesTotal: 12, copiesAvailable: 8, ageRange: "6-9" },
  { id: "bk-9", title: "How Things Work", author: "Conrad Mason", isbn: "9781409562818", category: "Science", copiesTotal: 7, copiesAvailable: 3, ageRange: "7-11" },
  { id: "bk-10", title: "African Folk Tales for Children", author: "Various", isbn: "9789785521207", category: "Folktale", copiesTotal: 15, copiesAvailable: 11, ageRange: "5-10" },
  { id: "bk-11", title: "The Boy Who Harnessed the Wind (Young Readers)", author: "William Kamkwamba", isbn: "9780147510426", category: "Biography", copiesTotal: 8, copiesAvailable: 5, ageRange: "9-12" },
  { id: "bk-12", title: "Oxford Primary Illustrated Dictionary", author: "Oxford", isbn: "9780192737momo", category: "Reference", copiesTotal: 20, copiesAvailable: 18, ageRange: "6-12" },
];

const borrowings: Borrowing[] = [];
for (let i = 0; i < 40; i++) {
  const book = pick(books);
  const student = students[int(0, students.length - 1)];
  const borrowedAt = addDays(DEMO_TODAY, -int(1, 30));
  const dueDate = addDays(borrowedAt, 14);
  const returned = chance(0.55);
  borrowings.push({
    id: `brw-${i + 1}`,
    bookId: book.id,
    studentId: student.id,
    borrowedAt: dayKey(borrowedAt),
    dueDate: dayKey(dueDate),
    returnedAt: returned ? dayKey(addDays(borrowedAt, int(3, 13))) : undefined,
    status: returned ? "returned" : dueDate < DEMO_TODAY ? "overdue" : "borrowed",
  });
}
// Give the demo pupil a visible borrowing history.
borrowings.push(
  { id: "brw-david-1", bookId: "bk-2", studentId: DEMO_STUDENT_ID, borrowedAt: dayKey(addDays(DEMO_TODAY, -9)), dueDate: dayKey(addDays(DEMO_TODAY, 5)), status: "borrowed" },
  { id: "brw-david-2", bookId: "bk-5", studentId: DEMO_STUDENT_ID, borrowedAt: dayKey(addDays(DEMO_TODAY, -30)), dueDate: dayKey(addDays(DEMO_TODAY, -16)), returnedAt: dayKey(addDays(DEMO_TODAY, -18)), status: "returned" },
);

const transportRoutes: TransportRoute[] = [];

const enquiries: Enquiry[] = Array.from({ length: 18 }, (_, i) => {
  const first = pick(chance(0.5) ? FEMALE_FIRST : MALE_FIRST);
  const last = pick(SURNAMES);
  return {
    id: `enq-${i + 1}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: phone(),
    category: pick(["admissions", "fees", "academics", "general"] as const),
    message: pick([
      "Good day. I would like to know whether there are still spaces in Primary 2 for this session.",
      "Please could you send me the full fee schedule for Primary 4?",
      "My family is relocating to Abuja in November. Do you accept mid-term transfers?",
      "Could you tell me which documents I need for a Primary 3 application?",
      "Does the school offer after-school care, and until what time?",
    ]),
    status: pick(["new", "assigned", "in_progress", "resolved"] as const),
    createdAt: iso(addDays(DEMO_TODAY, -int(1, 25))),
  };
});

const tourBookings: TourBooking[] = Array.from({ length: 9 }, (_, i) => {
  const first = pick(chance(0.5) ? FEMALE_FIRST : MALE_FIRST);
  const last = pick(SURNAMES);
  return {
    id: `tour-${i + 1}`,
    reference: `TOUR-2026-${String(i + 1).padStart(4, "0")}`,
    parentName: `${first} ${last}`,
    phone: phone(),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    preferredDate: dayKey(addDays(DEMO_TODAY, int(2, 20))),
    preferredTime: pick(["09:00", "10:00", "11:00", "12:00"]),
    visitors: int(1, 4),
    intendedLevelId: pick(CLASS_LEVELS.map((l) => l.id)),
    mode: pick(["physical", "virtual", "consultation"] as const),
    status: pick(["requested", "confirmed", "completed"] as const),
    createdAt: iso(addDays(DEMO_TODAY, -int(1, 14))),
  };
});

const emergencyNotices: EmergencyNotice[] = [
  {
    id: "en-1",
    title: "Early Closure — Thursday",
    body: "School will close at 1:00 PM on Thursday to allow staff to complete end-of-month safeguarding training. Parents collecting children should arrive by 12:45 PM.",
    priority: "high",
    audience: "all",
    startsAt: iso(addDays(DEMO_TODAY, -1)),
    endsAt: iso(addDays(DEMO_TODAY, 3)),
    active: true,
  },
];

const certificates: Certificate[] = [
  { id: "cert-1", certificateNo: "EIA-2026-00021", studentId: DEMO_STUDENT_ID, award: "Academic Excellence", sessionName: "2025/2026", issuedAt: "2026-07-24T10:00:00.000Z" },
  { id: "cert-2", certificateNo: "EIA-2026-00022", studentId: DEMO_STUDENT_ID, award: "Reading Champion", sessionName: "2025/2026", issuedAt: "2026-07-24T10:00:00.000Z" },
  { id: "cert-3", certificateNo: "EIA-2026-00023", studentId: students[10].id, award: "Sports", sessionName: "2025/2026", issuedAt: "2026-07-24T10:00:00.000Z" },
];

/* -------------------------------------------------------------------------- */
/* Users, notifications, messages, appointments, audit                         */
/* -------------------------------------------------------------------------- */

const users: User[] = [];
function addUser(u: Omit<User, "createdAt" | "active" | "avatarSeed"> & { avatarSeed?: string }) {
  users.push({ ...u, avatarSeed: u.avatarSeed ?? u.name, active: true, createdAt: "2026-08-01T08:00:00.000Z" });
}

// Named demo accounts. They are imported without a Clerk login; an administrator
// enables sign-in for any of them from the Users page.
addUser({ id: "usr-admin", name: "Ngozi Adeleke", username: "ngozi_adeleke", email: "admin@ebia.com.ng", roles: ["super_admin"], phone: phone() });
addUser({ id: "usr-head", name: "Dr. Amaka N. Okafor", username: "amaka_okafor", email: "headteacher@ebia.com.ng", roles: ["admin", "teacher"], teacherId: "tch-001", phone: phone() });
addUser({ id: "usr-teacher", name: "Miss Chiamaka Obi", username: "chiamaka_obi", email: "teacher@ebia.com.ng", roles: ["teacher"], teacherId: "tch-013", phone: phone() });
addUser({ id: "usr-maths", name: "Mr. Samuel Yusuf", username: "samuel_yusuf", email: "s.yusuf@ebia.com.ng", roles: ["teacher"], teacherId: "tch-019", phone: phone() });
addUser({ id: "usr-parent", name: "Mrs. Ada Chukwu", username: "ada_chukwu", email: "parent@ebia.com.ng", roles: ["parent"], parentId: DEMO_PARENT_ID, phone: phone() });
addUser({ id: "usr-pupil", name: "David Chukwu", username: "david_chukwu", email: "pupil@ebia.com.ng", roles: ["pupil"], studentId: DEMO_STUDENT_ID });
addUser({ id: "usr-accountant", name: "Mr. Bola Ogunleye", username: "bola_ogunleye", email: "accounts@ebia.com.ng", roles: ["admin"], phone: phone() });

const notifications: AppNotification[] = [];
let notificationCounter = 0;
function notify(userId: string, type: AppNotification["type"], title: string, body: string, href: string, daysAgo: number, read = false) {
  notificationCounter += 1;
  notifications.push({
    id: `ntf-${notificationCounter}`,
    userId, type, title, body, href,
    createdAt: iso(addDays(DEMO_TODAY, -daysAgo)),
    read,
  });
}

notify("usr-parent", "assignment_graded", "David's Mathematics assignment has been graded", "Fractions Around Us — 18/20. Tap to read Mr. Yusuf's feedback.", "/portal/parent/assignments", 1);
notify("usr-parent", "assignment_published", "New Mathematics assignment posted", "Multiplication Tables 6–9 is due next Tuesday.", "/portal/parent/assignments", 2);
notify("usr-parent", "fee_reminder", "First term fees are due", "An outstanding balance remains on invoice INV-2026-00001.", "/portal/parent/fees", 3, true);
notify("usr-parent", "event_reminder", "PTA meeting scheduled for Saturday", "The termly PTA general meeting holds at 10:00 AM in the auditorium.", "/calendar", 4, true);
notify("usr-parent", "attendance_alert", "Mary was marked absent today", "Please contact the class teacher if this is unexpected.", "/portal/parent/attendance", 5, true);
notify("usr-parent", "payment_confirmation", "Your fee payment was successful", "We have received your payment and a receipt is available to download.", "/portal/parent/payments", 12, true);

notify("usr-pupil", "assignment_published", "New Mathematics assignment posted", "Multiplication Tables 6–9 — due next Tuesday.", "/portal/pupil/assignments", 2);
notify("usr-pupil", "assignment_due", "English assignment is due tomorrow", "Parts of Speech closes at 6:00 PM tomorrow.", "/portal/pupil/assignments", 1);
notify("usr-pupil", "assignment_graded", "Your Mathematics assignment was graded", "You scored 18 out of 20. Well done!", "/portal/pupil/assignments", 1);
notify("usr-pupil", "announcement", "School resumes Monday", "Please arrive by 7:30 AM in full uniform.", "/portal/pupil/dashboard", 8, true);
notify("usr-pupil", "event_reminder", "Cultural Day registration is open", "Sign up with your class teacher before Friday.", "/portal/pupil/dashboard", 3, true);

notify("usr-teacher", "assignment_published", "7 submissions await grading", "Primary 4A — Fractions Around Us.", "/portal/teacher/grading", 1);
notify("usr-teacher", "announcement", "Staff briefing moved to 7:15 AM", "Tomorrow's briefing starts fifteen minutes earlier.", "/portal/teacher/dashboard", 2, true);

notify("usr-admin", "admission_update", "27 new applications this month", "Nine applications are awaiting review.", "/portal/admin/admissions", 1);
notify("usr-admin", "fee_reminder", "Outstanding fees report ready", "Termly fee collection now stands at 68 percent.", "/portal/admin/fees", 2, true);


const messageThreads: MessageThread[] = [
  {
    id: "thr-1",
    subject: "David's reading practice",
    participantIds: ["usr-parent", "usr-teacher"],
    studentId: DEMO_STUDENT_ID,
    createdAt: iso(addDays(DEMO_TODAY, -3)),
    updatedAt: iso(addDays(DEMO_TODAY, -1)),
    messages: [
      { id: "msg-1", senderId: "usr-parent", body: "Good afternoon Miss Obi. David has been enjoying the reading challenge. Could you suggest two books at his level for the weekend?", sentAt: iso(addDays(DEMO_TODAY, -3)), readBy: ["usr-parent", "usr-teacher"] },
      { id: "msg-2", senderId: "usr-teacher", body: "Good afternoon Mrs. Chukwu. That is lovely to hear. I would suggest Chike and the River, and Sugar Girl. Both are available in the library and I have reserved them for him.", sentAt: iso(addDays(DEMO_TODAY, -2)), readBy: ["usr-parent", "usr-teacher"] },
      { id: "msg-3", senderId: "usr-parent", body: "Thank you very much. We will start on Chike and the River tonight.", sentAt: iso(addDays(DEMO_TODAY, -1)), readBy: ["usr-parent"] },
    ],
  },
  {
    id: "thr-2",
    subject: "Mathematics support for David",
    participantIds: ["usr-parent", "usr-maths"],
    studentId: DEMO_STUDENT_ID,
    createdAt: iso(addDays(DEMO_TODAY, -8)),
    updatedAt: iso(addDays(DEMO_TODAY, -6)),
    messages: [
      { id: "msg-4", senderId: "usr-maths", body: "Good evening. David scored 18 out of 20 on the fractions assignment. Questions 7 and 9 involved simplifying, which we will revisit on Thursday.", sentAt: iso(addDays(DEMO_TODAY, -8)), readBy: ["usr-parent", "usr-maths"] },
      { id: "msg-5", senderId: "usr-parent", body: "Thank you for letting me know. We will practise simplifying at home this week.", sentAt: iso(addDays(DEMO_TODAY, -6)), readBy: ["usr-parent", "usr-maths"] },
    ],
  },
  {
    id: "thr-3",
    subject: "Change of address",
    participantIds: ["usr-parent", "usr-admin"],
    createdAt: iso(addDays(DEMO_TODAY, -14)),
    updatedAt: iso(addDays(DEMO_TODAY, -13)),
    messages: [
      { id: "msg-6", senderId: "usr-parent", body: "Good morning. We are moving to Utako next month. Please could you update our address on the children's records?", sentAt: iso(addDays(DEMO_TODAY, -14)), readBy: ["usr-parent", "usr-admin"] },
      { id: "msg-7", senderId: "usr-admin", body: "Good morning Mrs. Chukwu. Certainly. Please confirm your new address in writing and we will update the records from the first of next month.", sentAt: iso(addDays(DEMO_TODAY, -13)), readBy: ["usr-parent", "usr-admin"] },
    ],
  },
];

const availability: TeacherAvailability[] = [];
let availabilityCounter = 0;
for (const teacher of teachers.slice(0, 15)) {
  for (let d = 1; d <= 5; d++) {
    for (const time of ["09:30", "10:00", "10:30", "12:00"]) {
      if (!chance(0.5)) continue;
      availabilityCounter += 1;
      availability.push({
        id: `avl-${availabilityCounter}`,
        teacherId: teacher.id,
        date: dayKey(addDays(DEMO_TODAY, d)),
        time,
        taken: chance(0.2),
      });
    }
  }
}

const appointments: Appointment[] = [
  { id: "apt-1", teacherId: "tch-013", parentId: DEMO_PARENT_ID, studentId: DEMO_STUDENT_ID, date: dayKey(addDays(DEMO_TODAY, 4)), time: "10:00", mode: "in_person", status: "confirmed", note: "Discuss David's progress in English and reading." },
  { id: "apt-2", teacherId: "tch-019", parentId: DEMO_PARENT_ID, studentId: DEMO_STUDENT_ID, date: dayKey(addDays(DEMO_TODAY, 9)), time: "12:00", mode: "virtual", status: "requested", note: "Mathematics support plan." },
];

const auditLogs: AuditLog[] = [];
const AUDIT_ACTIONS: { action: string; entity: string; previous?: string; next?: string }[] = [
  { action: "Changed pupil class", entity: "Student", previous: "Primary 3A", next: "Primary 4A" },
  { action: "Published term results", entity: "Term", next: "First Term 2026/2027" },
  { action: "Updated fee structure", entity: "FeeStructure", previous: "₦340,000", next: "₦350,000" },
  { action: "Created assignment", entity: "Assignment", next: "Fractions Around Us" },
  { action: "Deactivated staff account", entity: "User", previous: "active", next: "inactive" },
  { action: "Approved admission", entity: "Application", previous: "under_review", next: "accepted" },
  { action: "Verified payment", entity: "Payment", next: "EIA-PAY-000042" },
  { action: "Uploaded school document", entity: "Document", next: "Parent Handbook" },
  { action: "Edited homepage content", entity: "ContentBlock", previous: "Hero headline", next: "Hero headline" },
  { action: "Granted role", entity: "User", previous: "teacher", next: "teacher, class_teacher" },
];
for (let i = 0; i < 48; i++) {
  const a = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  const actor = pick([
    { id: "usr-admin", name: "Ngozi Adeleke" },
    { id: "usr-head", name: "Dr. Amaka N. Okafor" },
    { id: "usr-admissions", name: "Mrs. Halima Sani" },
    { id: "usr-accountant", name: "Mr. Bola Ogunleye" },
  ]);
  auditLogs.push({
    id: `aud-${i + 1}`,
    actorId: actor.id,
    actorName: actor.name,
    action: a.action,
    entity: a.entity,
    entityId: `${a.entity.toLowerCase()}-${int(1000, 9999)}`,
    previousValue: a.previous,
    newValue: a.next,
    at: iso(addDays(DEMO_TODAY, -int(0, 45))),
    ip: `102.89.${int(0, 255)}.${int(1, 254)}`,
    device: pick(["Chrome on Windows", "Safari on iPhone", "Chrome on Android", "Edge on Windows"]),
  });
}
auditLogs.sort((a, b) => b.at.localeCompare(a.at));

/* -------------------------------------------------------------------------- */
/* Export                                                                      */
/* -------------------------------------------------------------------------- */

export interface Database {
  sessions: AcademicSession[];
  terms: typeof terms;
  levels: typeof CLASS_LEVELS;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  students: Student[];
  parents: Parent[];
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  attendance: AttendanceRecord[];
  results: ResultEntry[];
  reportCards: ReportCard[];
  invoices: Invoice[];
  payments: Payment[];
  applications: Application[];
  news: NewsPost[];
  events: SchoolEvent[];
  gallery: GalleryItem[];
  clubs: Club[];
  achievements: Achievement[];
  testimonials: Testimonial[];
  faqs: FaqItem[];
  documents: SchoolDocument[];
  vacancies: Vacancy[];
  books: Book[];
  borrowings: Borrowing[];
  transportRoutes: TransportRoute[];
  enquiries: Enquiry[];
  tourBookings: TourBooking[];
  emergencyNotices: EmergencyNotice[];
  certificates: Certificate[];
  notifications: AppNotification[];
  messageThreads: MessageThread[];
  appointments: Appointment[];
  availability: TeacherAvailability[];
  materials: LearningMaterial[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  timetable: TimetableSlot[];
  auditLogs: AuditLog[];
  teachingAssignments: Map<string, string>;
  calendar: typeof ACADEMIC_CALENDAR;
  weighting: typeof ASSESSMENT_WEIGHTING;
  activeTermId: string;
  demoStudentId: string;
  demoParentId: string;
}

export function buildDatabase(): Database {
  return {
    sessions,
    terms,
    levels: CLASS_LEVELS,
    classes,
    subjects,
    teachers,
    students,
    parents,
    users,
    assignments,
    submissions,
    attendance,
    results,
    reportCards,
    invoices,
    payments,
    applications,
    news,
    events,
    gallery,
    clubs,
    achievements,
    testimonials,
    faqs,
    documents,
    vacancies,
    books,
    borrowings,
    transportRoutes,
    enquiries,
    tourBookings,
    emergencyNotices,
    certificates,
    notifications,
    messageThreads,
    appointments,
    availability,
    materials,
    quizzes,
    quizAttempts,
    timetable,
    auditLogs,
    teachingAssignments,
    calendar: ACADEMIC_CALENDAR,
    weighting: ASSESSMENT_WEIGHTING,
    activeTermId: ACTIVE_TERM_ID,
    demoStudentId: DEMO_STUDENT_ID,
    demoParentId: DEMO_PARENT_ID,
  };
}
