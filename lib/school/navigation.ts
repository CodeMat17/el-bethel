export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: string;
}

export interface NavSection {
  label: string;
  href?: string;
  items?: NavLink[];
  featured?: { title: string; text: string; href: string; cta: string };
}

export const PUBLIC_NAV: NavSection[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    items: [
      { label: "Our Story", href: "/about", description: "How El-Bethel International began.", icon: "BookMarked" },
      { label: "Vision & Mission", href: "/about/vision-mission", description: "What we are working towards.", icon: "Telescope" },
      { label: "Core Values", href: "/about/core-values", description: "The seven values we teach and live.", icon: "Sparkles" },
      { label: "School Anthem", href: "/about/anthem", description: "The words we sing every morning.", icon: "Music" },
      { label: "Headteacher's Message", href: "/about/headteacher", description: "A welcome from Dr. Amaka N. Okafor.", icon: "MessageSquareQuote" },
      { label: "Leadership", href: "/about/leadership", description: "The team guiding our school.", icon: "Users" },
      { label: "Our Teachers", href: "/about/teachers", description: "Meet the people in our classrooms.", icon: "GraduationCap" },
      { label: "Accreditations & Awards", href: "/about/accreditations", description: "Recognition and standards.", icon: "Award" },
    ],
    featured: {
      title: "Knowledge and the fear of God",
      text: "Child-centred education in the heart of Abuja.",
      href: "/about",
      cta: "Read our story",
    },
  },
  {
    label: "Academics",
    href: "/academics",
    items: [
      { label: "Creche, Pre-School & Nursery", href: "/academics/early-years", description: "Creche to Nursery 3.", icon: "Baby" },
      { label: "Primary School", href: "/academics/primary", description: "Primary 1 to Primary 6.", icon: "School" },
      { label: "Junior Secondary", href: "/academics/junior-secondary", description: "JSS 1 to JSS 3.", icon: "GraduationCap" },
      { label: "Curriculum", href: "/academics/curriculum", description: "What your child learns, year by year.", icon: "BookOpen" },
      { label: "Subjects", href: "/academics/subjects", description: "Our full subject offering.", icon: "Library" },
      { label: "Learning Approach", href: "/academics/approach", description: "Child-centred and activity-based.", icon: "Lightbulb" },
      { label: "Assessment & Reports", href: "/academics/assessment", description: "How progress is measured and shared.", icon: "ClipboardCheck" },
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    items: [
      { label: "Why El-Bethel", href: "/admissions/why-el-bethel", description: "Seven reasons families choose us.", icon: "Heart" },
      { label: "Admission Process", href: "/admissions/process", description: "From enquiry to enrolment.", icon: "ListChecks" },
      { label: "Requirements", href: "/admissions/requirements", description: "Documents you will need.", icon: "FileCheck" },
      { label: "Fees", href: "/admissions/fees", description: "Termly fees by class band.", icon: "Receipt" },
      { label: "FAQs", href: "/admissions/faqs", description: "Answers to common questions.", icon: "CircleHelp" },
      { label: "Apply Online", href: "/admissions/apply", description: "Start or resume your application.", icon: "PenLine" },
      { label: "Check Application Status", href: "/admissions/status", description: "Track your application number.", icon: "Search" },
    ],
    featured: {
      title: "2026/2027 admission is open",
      text: "Creche, Pre-School, Nursery, Primary and JSS 1–3. Limited spaces are available in some classes.",
      href: "/admissions/apply",
      cta: "Apply online",
    },
  },
  {
    label: "School Life",
    href: "/school-life",
    items: [
      { label: "Clubs & Activities", href: "/school-life/clubs", description: "Sixteen clubs across STEM, arts and sport.", icon: "Puzzle" },
      { label: "Sports", href: "/school-life/sports", description: "Football, basketball, athletics and more.", icon: "Trophy" },
      { label: "Achievements", href: "/school-life/achievements", description: "Our Stars — pupil achievements.", icon: "Star" },
      { label: "Facilities", href: "/school-life/facilities", description: "Fourteen spaces built for children.", icon: "Building2" },
      { label: "Events", href: "/school-life/events", description: "What is coming up this term.", icon: "CalendarDays" },
      { label: "Gallery", href: "/school-life/gallery", description: "Moments from school life.", icon: "Images" },
      { label: "Library", href: "/school-life/library", description: "Our catalogue and reading programme.", icon: "BookOpenCheck" },
      { label: "Transport", href: "/school-life/transport", description: "Routes, times and safety.", icon: "Bus" },
    ],
  },
  { label: "News", href: "/news" },
  {
    label: "More",
    items: [
      { label: "School Calendar", href: "/calendar", description: "Terms, breaks and key dates.", icon: "CalendarRange" },
      { label: "Documents", href: "/documents", description: "Handbook, prospectus and policies.", icon: "FileText" },
      { label: "Book a School Tour", href: "/contact/tour", description: "Physical, virtual or a consultation.", icon: "MapPin" },
      { label: "Careers", href: "/careers", description: "Join our teaching community.", icon: "Briefcase" },
      { label: "Verify a Certificate", href: "/verify", description: "Check an El-Bethel certificate number.", icon: "BadgeCheck" },
      { label: "Contact Us", href: "/contact", description: "Talk to the school office.", icon: "Phone" },
    ],
  },
];

export const PORTAL_LINKS: NavLink[] = [
  { label: "Parent Portal", href: "/portal/parent", icon: "Users" },
  { label: "Pupil Portal", href: "/portal/pupil", icon: "Backpack" },
  { label: "Teacher Portal", href: "/portal/teacher", icon: "GraduationCap" },
  { label: "Admin Dashboard", href: "/portal/admin", icon: "LayoutDashboard" },
];

export interface PortalNavItem {
  label: string;
  href: string;
  icon: string;
}

export interface PortalNavGroup {
  label: string;
  items: PortalNavItem[];
}

export const PARENT_NAV: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/portal/parent", icon: "LayoutDashboard" },
      { label: "My Children", href: "/portal/parent/children", icon: "Users" },
      { label: "Notifications", href: "/portal/parent/notifications", icon: "Bell" },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Assignments", href: "/portal/parent/assignments", icon: "ClipboardList" },
      { label: "Results", href: "/portal/parent/results", icon: "Trophy" },
      { label: "Attendance", href: "/portal/parent/attendance", icon: "CalendarCheck" },
      { label: "Timetable", href: "/portal/parent/timetable", icon: "Clock" },
      { label: "Calendar", href: "/portal/parent/calendar", icon: "CalendarDays" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fees", href: "/portal/parent/fees", icon: "Receipt" },
      { label: "Payments", href: "/portal/parent/payments", icon: "CreditCard" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/portal/parent/messages", icon: "MessagesSquare" },
      { label: "Appointments", href: "/portal/parent/appointments", icon: "CalendarPlus" },
      { label: "Documents", href: "/portal/parent/documents", icon: "FileText" },
      { label: "Transport", href: "/portal/parent/transport", icon: "Bus" },
      { label: "Profile", href: "/portal/parent/profile", icon: "UserRound" },
    ],
  },
];

export const PUPIL_NAV: PortalNavGroup[] = [
  {
    label: "My Learning",
    items: [
      { label: "Home", href: "/portal/pupil", icon: "House" },
      { label: "My Assignments", href: "/portal/pupil/assignments", icon: "ClipboardList" },
      { label: "My Subjects", href: "/portal/pupil/subjects", icon: "BookOpen" },
      { label: "Learning Materials", href: "/portal/pupil/materials", icon: "FolderOpen" },
      { label: "Quizzes", href: "/portal/pupil/quizzes", icon: "Puzzle" },
    ],
  },
  {
    label: "My Progress",
    items: [
      { label: "My Results", href: "/portal/pupil/results", icon: "Trophy" },
      { label: "My Attendance", href: "/portal/pupil/attendance", icon: "CalendarCheck" },
      { label: "My Timetable", href: "/portal/pupil/timetable", icon: "Clock" },
      { label: "My Library", href: "/portal/pupil/library", icon: "Library" },
      { label: "My Profile", href: "/portal/pupil/profile", icon: "UserRound" },
    ],
  },
];

export const TEACHER_NAV: PortalNavGroup[] = [
  {
    label: "Teaching",
    items: [
      { label: "Dashboard", href: "/portal/teacher", icon: "LayoutDashboard" },
      { label: "My Classes", href: "/portal/teacher/classes", icon: "School" },
      { label: "Assignments", href: "/portal/teacher/assignments", icon: "ClipboardList" },
      { label: "Grading", href: "/portal/teacher/grading", icon: "PenSquare" },
      { label: "Materials", href: "/portal/teacher/materials", icon: "FolderOpen" },
      { label: "Quizzes", href: "/portal/teacher/quizzes", icon: "Puzzle" },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Attendance", href: "/portal/teacher/attendance", icon: "CalendarCheck" },
      { label: "Results", href: "/portal/teacher/results", icon: "Trophy" },
      { label: "Timetable", href: "/portal/teacher/timetable", icon: "Clock" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/portal/teacher/messages", icon: "MessagesSquare" },
      { label: "Appointments", href: "/portal/teacher/appointments", icon: "CalendarPlus" },
      { label: "Notifications", href: "/portal/teacher/notifications", icon: "Bell" },
      { label: "Profile", href: "/portal/teacher/profile", icon: "UserRound" },
    ],
  },
];

export const ADMIN_NAV: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/portal/admin", icon: "LayoutDashboard" },
      { label: "Reports & Analytics", href: "/portal/admin/reports", icon: "ChartColumn" },
      { label: "Audit Logs", href: "/portal/admin/audit-logs", icon: "ScrollText" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", href: "/portal/admin/students", icon: "Backpack" },
      { label: "Parents", href: "/portal/admin/parents", icon: "Users" },
      { label: "Teachers", href: "/portal/admin/teachers", icon: "GraduationCap" },
      { label: "Users & Roles", href: "/portal/admin/users", icon: "ShieldCheck" },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Classes", href: "/portal/admin/classes", icon: "School" },
      { label: "Subjects", href: "/portal/admin/subjects", icon: "Library" },
      { label: "Sessions & Terms", href: "/portal/admin/sessions", icon: "CalendarRange" },
      { label: "Assignments", href: "/portal/admin/assignments", icon: "ClipboardList" },
      { label: "Attendance", href: "/portal/admin/attendance", icon: "CalendarCheck" },
      { label: "Results", href: "/portal/admin/results", icon: "Trophy" },
    ],
  },
  {
    label: "Admissions & Finance",
    items: [
      { label: "Admissions", href: "/portal/admin/admissions", icon: "FileCheck" },
      { label: "Enquiries", href: "/portal/admin/enquiries", icon: "Inbox" },
      { label: "Tour Bookings", href: "/portal/admin/tours", icon: "MapPin" },
      { label: "Fees & Invoices", href: "/portal/admin/fees", icon: "Receipt" },
      { label: "Payments", href: "/portal/admin/payments", icon: "CreditCard" },
    ],
  },
  {
    label: "Content & Operations",
    items: [
      { label: "News", href: "/portal/admin/news", icon: "Newspaper" },
      { label: "Events", href: "/portal/admin/events", icon: "CalendarDays" },
      { label: "Gallery", href: "/portal/admin/gallery", icon: "Images" },
      { label: "Documents", href: "/portal/admin/documents", icon: "FileText" },
      { label: "Library", href: "/portal/admin/library", icon: "BookOpenCheck" },
      { label: "Transport", href: "/portal/admin/transport", icon: "Bus" },
      { label: "Notices", href: "/portal/admin/notices", icon: "Megaphone" },
      { label: "Settings", href: "/portal/admin/settings", icon: "Settings" },
    ],
  },
];
