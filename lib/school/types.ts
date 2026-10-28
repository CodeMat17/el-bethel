// Core domain model for the El-Bethel International Academy digital school platform.
// Strict types only — the `any` type is never used anywhere in this module.
//
// These are the shapes the app renders. Convex is the source of truth: its
// functions return documents in exactly these shapes (with `id` = the Convex
// document id), so a page never sees `_id` / `_creationTime`.

import type { Id } from "../../convex/_generated/dataModel";

export type ID = string;

export type Role = "super_admin" | "admin" | "site_admin" | "teacher" | "parent" | "pupil" | "transport";

export type Portal = "admin" | "teacher" | "parent" | "pupil" | "transport";

/** A photo or video stored on Cloudinary. */
export interface CloudMedia {
  publicId: string;
  url: string;
  resourceType: "image" | "video";
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface User {
  id: ID;
  name: string;
  /** Sign-in name. Every account has one; pupils sign in with it. */
  username?: string;
  email?: string;
  phone?: string;
  /** Set once the account exists in Clerk and can sign in. */
  clerkUserId?: string;
  roles: Role[];
  avatarSeed: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  teacherId?: ID;
  parentId?: ID;
  studentId?: ID;
}

export type StageKey =
  | "early_years"
  | "nursery"
  | "lower_primary"
  | "upper_primary"
  | "junior_secondary";

export interface ClassLevel {
  id: ID;
  name: string;
  stage: StageKey;
  order: number;
  /** Typical age of a child entering this level, in years. */
  entryAge: number;
}

export interface SchoolClass {
  id: ID;
  levelId: ID;
  /** e.g. "Primary 4A" */
  name: string;
  section: string;
  classTeacherId?: ID;
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
  /** Derived from teaching assignments. */
  subjectIds: ID[];
  /** Classes this teacher teaches or is class teacher of. Derived. */
  classIds: ID[];
  isClassTeacher: boolean;
  active: boolean;
  joinedAt: string;
  avatarSeed: string;
  photo?: CloudMedia;
  featured: boolean;
}

/** One row of "who teaches what where". */
export interface TeachingAssignment {
  id: ID;
  classId: ID;
  subjectId: ID;
  teacherId: ID;
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
  /** Derived from guardianships. */
  parentIds: ID[];
  status: "active" | "graduated" | "transferred" | "archived";
  enrolledAt: string;
  avatarSeed: string;
  photo?: CloudMedia;
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
  /** Derived from guardianships. */
  studentIds: ID[];
  avatarSeed: string;
  photo?: CloudMedia;
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

/* ------------------------------- assignments ------------------------------ */

/**
 * The answer format the teacher chose for a question:
 * "text" — typed answer (marked by the teacher);
 * "single" — radio buttons; "multiple" — checkboxes.
 */
export type QuestionType = "text" | "single" | "multiple";

export interface Question {
  id: ID;
  type: QuestionType;
  prompt: string;
  options: string[];
  /**
   * Indices of the correct options. Present for staff; stripped from what a
   * pupil receives until their work has been marked and the due date passed.
   */
  correct: number[];
  points: number;
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
  questions: Question[];
  publishedAt: string;
  startDate: string;
  dueDate: string;
  maxScore: number;
  status: "draft" | "published" | "closed" | "archived";
  createdAt: string;
}

export interface QuestionAnswer {
  questionId: ID;
  text?: string;
  selected?: number[];
  /** Marks awarded; undefined until marked. */
  awarded?: number;
  autoMarked?: boolean;
}

/** Stored states of a submission. */
export type SubmissionStatus = "submitted" | "graded";

/** What the UI shows for a pupil's assignment, including states with no submission. */
export type AssignmentProgress = "not_started" | "missed" | "submitted" | "graded";

export interface Submission {
  id: ID;
  assignmentId: ID;
  studentId: ID;
  status: SubmissionStatus;
  answers: QuestionAnswer[];
  submittedAt: string;
  score?: number;
  grade?: string;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: ID;
}

/* ------------------------------- attendance ------------------------------- */

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: ID;
  studentId: ID;
  classId: ID;
  date: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy?: ID;
}

/* --------------------------------- results -------------------------------- */

export interface AssessmentWeighting {
  component: "ca" | "exam";
  label: string;
  weight: number;
  maxScore: number;
}

/** A pupil's summarised score in one subject for one term. */
export interface ResultEntry {
  id: ID;
  studentId: ID;
  subjectId: ID;
  classId: ID;
  termId: ID;
  ca: number;
  exam: number;
  /** Marks the CA was out of; the exam is out of 100 minus this. Missing = DEFAULT_CA_MAX. */
  caMax?: number;
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

/* ---------------------------------- fees ---------------------------------- */

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

/* ------------------------------- admissions ------------------------------- */

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

/* ----------------------------- website content ---------------------------- */

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
  cover?: CloudMedia;
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
  category: "academic" | "sports" | "cultural" | "parents" | "holiday" | "assessment" | "alumni";
  requiresRegistration: boolean;
  status: "upcoming" | "past" | "cancelled";
  cover?: CloudMedia;
}

export interface GalleryItem {
  id: ID;
  title: string;
  caption: string;
  category: string;
  takenAt: string;
  consentCleared: boolean;
  tone: string;
  media?: CloudMedia;
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
  | "appointment"
  | "quiz_published"
  | "quiz_marked"
  | "library_due"
  | "library_overdue"
  | "certificate_issued"
  | "achievement"
  | "transport_update"
  | "bus_trip"
  | "parent_insight"
  | "store_order"
  | "library_reservation";

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
  media?: CloudMedia;
  sizeBytes: number;
  uploadedAt: string;
  downloads: number;
}

export interface QuizQuestion {
  id: ID;
  type: "multiple_choice" | "true_false" | "short_answer" | "picture" | "matching";
  prompt: string;
  options: string[];
  /** The right option; for short answers, accepted answers separated by "|" (empty = marked by hand). */
  answer: string;
  points: number;
  imageUrl?: string;
  pairs?: { left: string; right: string }[];
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
  day: number;
  period: number;
  startTime: string;
  endTime: string;
  subjectId?: ID;
  teacherId?: ID;
  label?: string;
}

export interface Club {
  id: ID;
  slug: string;
  name: string;
  description: string;
  coordinatorId?: ID;
  meetingDay: string;
  meetingTime: string;
  memberCount: number;
  category: "stem" | "arts" | "sports" | "literary" | "service";
}

export interface Achievement {
  id: ID;
  studentInitials: string;
  classLabel: string;
  category: string;
  title: string;
  description: string;
  date: string;
  studentId?: ID;
  published?: boolean;
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
  actorId?: ID;
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
  driverPhone?: string;
  attendantPhone?: string;
  stops: { name: string; pickupTime: string; dropoffTime: string; lat?: number; lng?: number }[];
  capacity: number;
}

export interface SchoolDocument {
  id: ID;
  title: string;
  description: string;
  fileName: string;
  sizeBytes: number;
  /** Set once a PDF has been uploaded. */
  storageId?: string;
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
  category?: string;
  citation?: string;
  achievementId?: ID;
  revokedAt?: string;
  revokedReason?: string;
}

/** The signed-in user, as resolved by Convex from the Clerk session. */
export interface SessionUser {
  id: Id<"users">;
  name: string;
  email?: string;
  username?: string;
  roles: Role[];
  avatarSeed: string;
  /** The linked teacher, parent or pupil record's profile photo. */
  photoUrl?: string;
  teacherId?: Id<"teachers">;
  parentId?: Id<"parents">;
  studentId?: Id<"students">;
}
