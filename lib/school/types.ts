// Core domain model for the El-Bethel International Academy digital school platform.
// Strict types only — the `any` type is never used anywhere in this module.

export type ID = string;

export type Role =
  | "super_admin"
  | "admin"
  | "headteacher"
  | "deputy_headteacher"
  | "teacher"
  | "accountant"
  | "admissions_officer"
  | "librarian"
  | "parent"
  | "pupil"
  | "applicant";

export type Portal = "admin" | "teacher" | "parent" | "pupil" | "admissions";

export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  /** Demo-only credential. A real deployment delegates this to Clerk / an auth provider. */
  password: string;
  roles: Role[];
  avatarSeed: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  teacherId?: ID;
  parentId?: ID;
  studentId?: ID;
}

export type StageKey = "lower_primary" | "upper_primary";

export interface ClassLevel {
  id: ID;
  name: string;
  stage: StageKey;
  order: number;
}

export interface SchoolClass {
  id: ID;
  levelId: ID;
  /** e.g. "Primary 4A" */
  name: string;
  section: string;
  classTeacherId: ID;
  capacity: number;
  room: string;
}

export type SubjectGroup = "core" | "additional";

export interface Subject {
  id: ID;
  name: string;
  code: string;
  group: SubjectGroup;
  levelIds: ID[];
}

export interface Teacher {
  id: ID;
  staffNo: string;
  firstName: string;
  lastName: string;
  title: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  qualifications: string[];
  experienceYears: number;
  bio: string;
  subjectIds: ID[];
  classIds: ID[];
  isClassTeacher: boolean;
  active: boolean;
  joinedAt: string;
  avatarSeed: string;
  featured: boolean;
}

export type Gender = "Male" | "Female";

export interface Student {
  id: ID;
  studentNo: string;
  admissionNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  address: string;
  classId: ID;
  parentIds: ID[];
  status: "active" | "graduated" | "transferred" | "archived";
  enrolledAt: string;
  avatarSeed: string;
  house: "Emerald" | "Sapphire" | "Ruby" | "Amber";
  bloodGroup: string;
  medicalNotes?: string;
  transportRouteId?: ID;
}

export interface Parent {
  id: ID;
  title: string;
  firstName: string;
  lastName: string;
  relationship: "Father" | "Mother" | "Guardian";
  email: string;
  phone: string;
  occupation: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  studentIds: ID[];
  avatarSeed: string;
}

export interface AcademicSession {
  id: ID;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export type TermKey = "first" | "second" | "third";

export interface Term {
  id: ID;
  sessionId: ID;
  key: TermKey;
  name: string;
  startDate: string;
  endDate: string;
  examStart: string;
  examEnd: string;
  resultPublishDate: string;
  active: boolean;
}

export type SubmissionType = "text" | "image" | "pdf" | "docx" | "multiple";

export interface Attachment {
  id: ID;
  name: string;
  mime: string;
  sizeBytes: number;
  url: string;
}

export interface Assignment {
  id: ID;
  title: string;
  topic: string;
  description: string;
  instructions: string;
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  termId: ID;
  publishedAt: string;
  startDate: string;
  dueDate: string;
  maxScore: number;
  submissionTypes: SubmissionType[];
  allowResubmission: boolean;
  attachments: Attachment[];
  status: "draft" | "published" | "closed" | "archived";
}

export type SubmissionStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "late"
  | "grading"
  | "graded"
  | "returned"
  | "resubmission_required";

export interface Submission {
  id: ID;
  assignmentId: ID;
  studentId: ID;
  status: SubmissionStatus;
  textAnswer?: string;
  files: Attachment[];
  submittedAt?: string;
  version: number;
  score?: number;
  grade?: string;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: ID;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: ID;
  studentId: ID;
  classId: ID;
  date: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy: ID;
}

export type AssessmentComponent =
  | "classwork"
  | "homework"
  | "assignment"
  | "test"
  | "project"
  | "practical"
  | "midterm"
  | "exam";

export interface AssessmentWeighting {
  component: AssessmentComponent;
  label: string;
  weight: number;
  maxScore: number;
}

export interface ResultEntry {
  id: ID;
  studentId: ID;
  subjectId: ID;
  classId: ID;
  termId: ID;
  scores: Partial<Record<AssessmentComponent, number>>;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
  position?: number;
}

export interface ReportCard {
  id: ID;
  studentId: ID;
  termId: ID;
  classId: ID;
  average: number;
  totalScore: number;
  position: number;
  classSize: number;
  attendancePresent: number;
  attendanceTotal: number;
  conduct: { label: string; rating: number }[];
  teacherComment: string;
  headteacherComment: string;
  promotionStatus: "promoted" | "pending" | "repeat";
  publishedAt?: string;
}

export type FeeCategory =
  | "tuition"
  | "learning_resources"
  | "activities"
  | "technology"
  | "transport"
  | "meals"
  | "uniform"
  | "books"
  | "registration"
  | "examination";

export interface FeeLine {
  category: FeeCategory;
  label: string;
  amount: number;
}

export type InvoiceStatus = "draft" | "issued" | "part_paid" | "paid" | "overdue" | "void";

export interface Invoice {
  id: ID;
  invoiceNo: string;
  studentId: ID;
  termId: ID;
  lines: FeeLine[];
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
}

export type PaymentProvider = "paystack" | "flutterwave" | "bank_transfer" | "cash";

export interface Payment {
  id: ID;
  reference: string;
  invoiceId: ID;
  studentId: ID;
  amount: number;
  provider: PaymentProvider;
  status: "pending" | "successful" | "failed" | "reversed";
  paidAt: string;
  verifiedAt?: string;
  receiptNo: string;
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "documents_required"
  | "assessment_scheduled"
  | "assessment_completed"
  | "interview_scheduled"
  | "accepted"
  | "conditionally_accepted"
  | "waitlisted"
  | "not_accepted"
  | "withdrawn"
  | "enrolled";

export interface ApplicationDocument {
  key: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  uploadedAt?: string;
}

export interface ApplicationEvent {
  at: string;
  status: ApplicationStatus;
  note: string;
  actor: string;
}

export interface ApplicationPupil {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | "";
  nationality: string;
  previousSchool: string;
  currentClass: string;
  address: string;
  photoUploaded: boolean;
}

export interface ApplicationGuardian {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface Application {
  id: ID;
  applicationNo: string;
  sessionId: ID;
  intendedLevelId: ID;
  status: ApplicationStatus;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  pupil: ApplicationPupil;
  guardian: ApplicationGuardian;
  documents: ApplicationDocument[];
  applicationFeePaid: boolean;
  applicationFeeReference?: string;
  assessment?: { date: string; time: string; venue: string; score?: number };
  interview?: { date: string; time: string; venue: string };
  decisionNote?: string;
  timeline: ApplicationEvent[];
  ownerEmail: string;
}

export interface NewsPost {
  id: ID;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  publishedAt: string;
  status: "draft" | "scheduled" | "published" | "archived";
  tone: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
}

export interface SchoolEvent {
  id: ID;
  slug: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  venue: string;
  category: "academic" | "sports" | "cultural" | "parents" | "holiday" | "assessment";
  requiresRegistration: boolean;
  status: "upcoming" | "past" | "cancelled";
}

export interface GalleryItem {
  id: ID;
  title: string;
  caption: string;
  category: string;
  takenAt: string;
  consentCleared: boolean;
  tone: string;
}

export type NotificationType =
  | "assignment_published"
  | "assignment_due"
  | "assignment_graded"
  | "attendance_alert"
  | "result_published"
  | "fee_reminder"
  | "payment_confirmation"
  | "admission_update"
  | "announcement"
  | "event_reminder"
  | "message"
  | "appointment";

export interface AppNotification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

export interface ThreadMessage {
  id: ID;
  senderId: ID;
  body: string;
  sentAt: string;
  readBy: ID[];
}

export interface MessageThread {
  id: ID;
  subject: string;
  participantIds: ID[];
  studentId?: ID;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
}

export interface Appointment {
  id: ID;
  teacherId: ID;
  parentId: ID;
  studentId: ID;
  date: string;
  time: string;
  mode: "in_person" | "virtual";
  status: "requested" | "confirmed" | "rescheduled" | "cancelled" | "completed";
  note?: string;
}

export interface TeacherAvailability {
  id: ID;
  teacherId: ID;
  date: string;
  time: string;
  taken: boolean;
}

export interface LearningMaterial {
  id: ID;
  title: string;
  description: string;
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  kind: "note" | "pdf" | "worksheet" | "video" | "audio" | "slides" | "link" | "image";
  url: string;
  sizeBytes: number;
  uploadedAt: string;
  downloads: number;
}

export interface QuizQuestion {
  id: ID;
  type: "multiple_choice" | "true_false" | "short_answer" | "picture";
  prompt: string;
  options: string[];
  answer: string;
  points: number;
}

export interface Quiz {
  id: ID;
  title: string;
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  description: string;
  durationMinutes: number;
  attemptsAllowed: number;
  randomize: boolean;
  showResultsImmediately: boolean;
  questions: QuizQuestion[];
  opensAt: string;
  closesAt: string;
  status: "draft" | "published" | "closed";
}

export interface QuizAttempt {
  id: ID;
  quizId: ID;
  studentId: ID;
  answers: Record<string, string>;
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt?: string;
  attemptNo: number;
}

export interface TimetableSlot {
  id: ID;
  classId: ID;
  day: 1 | 2 | 3 | 4 | 5;
  period: number;
  startTime: string;
  endTime: string;
  subjectId: ID | null;
  teacherId: ID | null;
  label?: string;
}

export interface Club {
  id: ID;
  slug: string;
  name: string;
  description: string;
  coordinatorId: ID;
  meetingDay: string;
  meetingTime: string;
  memberCount: number;
  category: "stem" | "arts" | "sports" | "literary" | "service";
}

export interface Achievement {
  id: ID;
  studentInitials: string;
  classLabel: string;
  category:
    | "Academic Excellence"
    | "Sports"
    | "Music"
    | "Arts"
    | "Competitions"
    | "STEM"
    | "Reading"
    | "Leadership"
    | "Community Service";
  title: string;
  description: string;
  date: string;
}

export interface Facility {
  id: ID;
  slug: string;
  name: string;
  summary: string;
  description: string;
  highlights: string[];
  icon: string;
}

export interface Enquiry {
  id: ID;
  name: string;
  email: string;
  phone: string;
  category: "admissions" | "fees" | "academics" | "transport" | "general";
  message: string;
  status: "new" | "assigned" | "in_progress" | "resolved" | "archived";
  assignedTo?: string;
  reply?: string;
  createdAt: string;
}

export interface TourBooking {
  id: ID;
  reference: string;
  parentName: string;
  phone: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  visitors: number;
  intendedLevelId: ID;
  mode: "physical" | "virtual" | "consultation";
  notes?: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface AuditLog {
  id: ID;
  actorId: ID;
  actorName: string;
  action: string;
  entity: string;
  entityId: ID;
  previousValue?: string;
  newValue?: string;
  at: string;
  ip: string;
  device: string;
}

export interface EmergencyNotice {
  id: ID;
  title: string;
  body: string;
  priority: "high" | "critical";
  audience: "all" | "parents" | "staff" | "pupils";
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface Book {
  id: ID;
  title: string;
  author: string;
  isbn: string;
  category: string;
  copiesTotal: number;
  copiesAvailable: number;
  ageRange: string;
}

export interface Borrowing {
  id: ID;
  bookId: ID;
  studentId: ID;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: "borrowed" | "returned" | "overdue";
}

export interface TransportRoute {
  id: ID;
  busNo: string;
  route: string;
  driver: string;
  attendant: string;
  stops: { name: string; pickupTime: string; dropoffTime: string }[];
  capacity: number;
}

export interface SchoolDocument {
  id: ID;
  title: string;
  description: string;
  fileName: string;
  sizeBytes: number;
  visibility: "public" | "parents" | "staff";
  updatedAt: string;
  category: string;
}

export interface Vacancy {
  id: ID;
  slug: string;
  title: string;
  department: string;
  type: "Full-time" | "Part-time" | "Contract";
  location: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  closingDate: string;
  status: "open" | "closed";
}

export interface Testimonial {
  id: ID;
  name: string;
  relationship: string;
  quote: string;
  avatarSeed: string;
}

export interface FaqItem {
  id: ID;
  category: string;
  question: string;
  answer: string;
}

export interface Certificate {
  id: ID;
  certificateNo: string;
  studentId: ID;
  award: string;
  sessionName: string;
  issuedAt: string;
}

export interface SessionUser {
  id: ID;
  name: string;
  email: string;
  roles: Role[];
  avatarSeed: string;
  teacherId?: ID;
  parentId?: ID;
  studentId?: ID;
}
