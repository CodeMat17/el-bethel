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
      { label: "Our Story", href: "/about", description: "Our history, vision, values, anthem and accreditation.", icon: "BookMarked" },
      { label: "Our Team", href: "/about/team", description: "The Headteacher, leadership and teachers.", icon: "Users" },
    ],
    featured: {
      title: "Knowledge and the fear of God",
      text: "Child-centred education in the heart of Abuja.",
      href: "/about",
      cta: "Read our story",
    },
  },
  { label: "Academics", href: "/academics" },
  {
    label: "Admissions",
    href: "/admissions",
    items: [
      { label: "Admissions Overview", href: "/admissions", description: "Process, requirements, fees and FAQs.", icon: "ListChecks" },
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
      { label: "School Life", href: "/school-life", description: "Clubs, sports, library and facilities.", icon: "Puzzle" },
      { label: "Events", href: "/school-life/events", description: "What is coming up this term.", icon: "CalendarDays" },
      { label: "Gallery", href: "/school-life/gallery", description: "Moments from school life.", icon: "Images" },
    ],
  },
  { label: "News", href: "/news" },
  {
    label: "More",
    items: [
      { label: "School Calendar", href: "/calendar", description: "Terms, breaks and key dates.", icon: "CalendarRange" },
      { label: "Documents", href: "/documents", description: "Handbook, prospectus and policies.", icon: "FileText" },
      { label: "Alumni", href: "/alumni", description: "Stories from former pupils.", icon: "HandHeart" },
      { label: "Verify a Certificate", href: "/verify", description: "Check an El-Bethel certificate number.", icon: "BadgeCheck" },
      { label: "Contact Us", href: "/contact", description: "Talk to the school office.", icon: "Phone" },
    ],
  },
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
      { label: "Timetable", href: "/portal/parent/timetable", icon: "Clock" },
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
    label: "Account",
    items: [
      { label: "Documents", href: "/portal/parent/documents", icon: "FileText" },
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
    ],
  },
  {
    label: "My Records",
    items: [
      { label: "My Results", href: "/portal/pupil/results", icon: "Trophy" },
      { label: "My Timetable", href: "/portal/pupil/timetable", icon: "Clock" },
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
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Results", href: "/portal/teacher/results", icon: "Trophy" },
      { label: "Timetable", href: "/portal/teacher/timetable", icon: "Clock" },
    ],
  },
  {
    label: "Account",
    items: [
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
      { label: "Notifications", href: "/portal/admin/notifications", icon: "Bell" },
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
      { label: "Events", href: "/portal/admin/events", icon: "CalendarDays" },
      { label: "Assignments", href: "/portal/admin/assignments", icon: "ClipboardList" },
      { label: "Results", href: "/portal/admin/results", icon: "Trophy" },
    ],
  },
  {
    label: "Admissions & Finance",
    items: [
      { label: "Admissions", href: "/portal/admin/admissions", icon: "FileCheck" },
      { label: "Enquiries", href: "/portal/admin/enquiries", icon: "Inbox" },
      { label: "Fees & Invoices", href: "/portal/admin/fees", icon: "Receipt" },
      { label: "Fee Structure", href: "/portal/admin/fees/structure", icon: "Banknote" },
      { label: "Payments", href: "/portal/admin/payments", icon: "CreditCard" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Documents", href: "/portal/admin/documents", icon: "FileText" },
      { label: "Our Stars", href: "/portal/admin/achievements", icon: "Star" },
      { label: "Certificates", href: "/portal/admin/certificates", icon: "Award" },
      { label: "Alumni", href: "/portal/admin/alumni", icon: "HandHeart" },
      { label: "Notices", href: "/portal/admin/notices", icon: "Megaphone" },
      { label: "Settings", href: "/portal/admin/settings", icon: "Settings" },
    ],
  },
];

/** Lists edited directly in the Site portal (no draft step). */
export const SITE_COLLECTIONS: (PortalNavItem & { description: string })[] = [
  { label: "News", href: "/portal/site/news", icon: "Newspaper", description: "Posts and announcements" },
  { label: "Events", href: "/portal/site/events", icon: "CalendarDays", description: "The school calendar" },
  { label: "Gallery", href: "/portal/site/gallery", icon: "Images", description: "Photos and videos" },
  { label: "Testimonials", href: "/portal/site/testimonials", icon: "MessageSquareQuote", description: "What families say" },
  { label: "Clubs", href: "/portal/site/clubs", icon: "Puzzle", description: "Clubs and activities" },
  { label: "FAQs", href: "/portal/site/faqs", icon: "CircleHelp", description: "Admissions questions and answers" },
];

/** The Site portal: public website content only. */
export const SITE_NAV: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/portal/site", icon: "LayoutDashboard" }],
  },
  {
    label: "Pages",
    items: [
      { label: "Homepage", href: "/portal/site/edit/home", icon: "House" },
      { label: "Our story", href: "/portal/site/edit/about", icon: "BookMarked" },
      { label: "Our team", href: "/portal/site/edit/team", icon: "Users" },
      { label: "Academics", href: "/portal/site/edit/academics", icon: "GraduationCap" },
      { label: "Admissions", href: "/portal/site/edit/admissions", icon: "FileCheck" },
      { label: "School life", href: "/portal/site/edit/schoolLife", icon: "Puzzle" },
      { label: "Alumni", href: "/portal/site/edit/alumni", icon: "HandHeart" },
      { label: "Contact", href: "/portal/site/edit/contact", icon: "Phone" },
      { label: "Privacy", href: "/portal/site/edit/privacy", icon: "ScrollText" },
      { label: "Terms", href: "/portal/site/edit/terms", icon: "ScrollText" },
    ],
  },
  {
    label: "School details",
    items: [
      { label: "Identity & contact", href: "/portal/site/edit/identity", icon: "School" },
      { label: "Fees & admission rules", href: "/portal/site/edit/fees", icon: "Receipt" },
    ],
  },
  { label: "Collections", items: SITE_COLLECTIONS.map(({ label, href, icon }) => ({ label, href, icon })) },
];
