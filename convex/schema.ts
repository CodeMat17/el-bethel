import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  applicationStatus,
  cloudMedia,
  feeLine,
  question,
  questionAnswer,
  role,
} from "./validators";

/**
 * El-Bethel International Academy — Convex schema.
 *
 * Dates are stored as ISO-8601 strings (sortable, and identical to the shapes the
 * Next.js app already renders). Class levels ("lvl-p4") are fixed configuration
 * in `lib/school/config.ts`, so they are referenced by key rather than by id.
 *
 * `legacyId` exists only on rows imported by the demo seed so that the importer
 * can resolve references; nothing in the application reads it.
 */
export default defineSchema({
  /* ------------------------------- accounts ------------------------------- */

  users: defineTable({
    clerkUserId: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.string(),
    phone: v.optional(v.string()),
    roles: v.array(role),
    active: v.boolean(),
    avatarSeed: v.string(),
    teacherId: v.optional(v.id("teachers")),
    parentId: v.optional(v.id("parents")),
    studentId: v.optional(v.id("students")),
    createdAt: v.string(),
    lastLoginAt: v.optional(v.string()),
    legacyId: v.optional(v.string()),
  })
    .index("by_clerk", ["clerkUserId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_teacher", ["teacherId"])
    .index("by_parent", ["parentId"])
    .index("by_student", ["studentId"])
    .index("by_legacy", ["legacyId"]),

  /* ------------------------------- academics ------------------------------ */

  academicSessions: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    active: v.boolean(),
    legacyId: v.optional(v.string()),
  }).index("by_legacy", ["legacyId"]),

  terms: defineTable({
    sessionId: v.id("academicSessions"),
    key: v.union(v.literal("first"), v.literal("second"), v.literal("third")),
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    examStart: v.string(),
    examEnd: v.string(),
    resultPublishDate: v.string(),
    active: v.boolean(),
    legacyId: v.optional(v.string()),
  })
    .index("by_session", ["sessionId"])
    .index("by_active", ["active"])
    .index("by_legacy", ["legacyId"]),

  classes: defineTable({
    levelId: v.string(),
    name: v.string(),
    section: v.string(),
    classTeacherId: v.optional(v.id("teachers")),
    capacity: v.number(),
    room: v.string(),
    legacyId: v.optional(v.string()),
  })
    .index("by_level", ["levelId"])
    .index("by_class_teacher", ["classTeacherId"])
    .index("by_legacy", ["legacyId"]),

  subjects: defineTable({
    name: v.string(),
    code: v.string(),
    group: v.union(v.literal("core"), v.literal("additional")),
    levelIds: v.array(v.string()),
    legacyId: v.optional(v.string()),
  })
    .index("by_code", ["code"])
    .index("by_legacy", ["legacyId"]),

  teachers: defineTable({
    staffNo: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    title: v.string(),
    position: v.string(),
    department: v.string(),
    email: v.string(),
    phone: v.string(),
    qualifications: v.array(v.string()),
    experienceYears: v.number(),
    bio: v.string(),
    active: v.boolean(),
    joinedAt: v.string(),
    avatarSeed: v.string(),
    photo: v.optional(cloudMedia),
    featured: v.boolean(),
    legacyId: v.optional(v.string()),
  })
    .index("by_staff_no", ["staffNo"])
    .index("by_legacy", ["legacyId"]),

  /** Who teaches which subject in which class. One teacher per (class, subject). */
  teachingAssignments: defineTable({
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    teacherId: v.id("teachers"),
  })
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId"])
    .index("by_class_subject", ["classId", "subjectId"]),

  students: defineTable({
    studentNo: v.string(),
    admissionNo: v.string(),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.union(v.literal("Male"), v.literal("Female")),
    nationality: v.string(),
    address: v.string(),
    classId: v.id("classes"),
    status: v.union(
      v.literal("active"),
      v.literal("graduated"),
      v.literal("transferred"),
      v.literal("archived"),
    ),
    enrolledAt: v.string(),
    avatarSeed: v.string(),
    photo: v.optional(cloudMedia),
    house: v.union(v.literal("Emerald"), v.literal("Sapphire"), v.literal("Ruby"), v.literal("Amber")),
    bloodGroup: v.string(),
    medicalNotes: v.optional(v.string()),
    legacyId: v.optional(v.string()),
  })
    .index("by_class", ["classId"])
    .index("by_student_no", ["studentNo"])
    .index("by_status", ["status"])
    .index("by_legacy", ["legacyId"]),

  parents: defineTable({
    title: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    relationship: v.union(v.literal("Father"), v.literal("Mother"), v.literal("Guardian")),
    email: v.string(),
    phone: v.string(),
    occupation: v.string(),
    address: v.string(),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    avatarSeed: v.string(),
    photo: v.optional(cloudMedia),
    legacyId: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_legacy", ["legacyId"]),

  /** Parent ↔ child links (many-to-many). */
  guardianships: defineTable({
    parentId: v.id("parents"),
    studentId: v.id("students"),
  })
    .index("by_parent", ["parentId"])
    .index("by_student", ["studentId"])
    .index("by_parent_student", ["parentId", "studentId"]),

  /* ------------------------------ assignments ----------------------------- */

  assignments: defineTable({
    title: v.string(),
    topic: v.string(),
    description: v.string(),
    instructions: v.string(),
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    teacherId: v.id("teachers"),
    termId: v.id("terms"),
    questions: v.array(question),
    maxScore: v.number(),
    publishedAt: v.string(),
    startDate: v.string(),
    dueDate: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("closed"),
      v.literal("archived"),
    ),
    createdAt: v.string(),
    legacyId: v.optional(v.string()),
  })
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId"])
    .index("by_status", ["status"])
    .index("by_legacy", ["legacyId"]),

  submissions: defineTable({
    assignmentId: v.id("assignments"),
    studentId: v.id("students"),
    status: v.union(v.literal("submitted"), v.literal("graded")),
    answers: v.array(questionAnswer),
    submittedAt: v.string(),
    /** Total of the marks awarded so far (auto-marked questions count immediately). */
    score: v.optional(v.number()),
    grade: v.optional(v.string()),
    feedback: v.optional(v.string()),
    gradedAt: v.optional(v.string()),
    gradedBy: v.optional(v.id("users")),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_student", ["studentId"])
    .index("by_assignment_student", ["assignmentId", "studentId"])
    .index("by_status", ["status"]),

  /* -------------------------------- results ------------------------------- */

  /** One subject's summarised score for one pupil in one term. */
  results: defineTable({
    studentId: v.id("students"),
    subjectId: v.id("subjects"),
    classId: v.id("classes"),
    termId: v.id("terms"),
    ca: v.number(),
    exam: v.number(),
    /** Marks the CA was out of; the exam is out of 100 minus this. Missing = DEFAULT_CA_MAX. */
    caMax: v.optional(v.number()),
    total: v.number(),
    grade: v.string(),
    remark: v.string(),
    position: v.optional(v.number()),
    enteredBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.string()),
  })
    .index("by_student_term", ["studentId", "termId"])
    .index("by_class_term", ["classId", "termId"])
    .index("by_class_term_subject", ["classId", "termId", "subjectId"])
    .index("by_term", ["termId"]),

  /** One subject's mid-term test score for one pupil in one term. Separate from the end-of-term CA and exam. */
  midtermScores: defineTable({
    studentId: v.id("students"),
    subjectId: v.id("subjects"),
    classId: v.id("classes"),
    termId: v.id("terms"),
    score: v.number(),
    /** Marks the test was out of. */
    maxScore: v.number(),
    /** The score as a percentage, which the grade is taken from. */
    percent: v.number(),
    grade: v.string(),
    remark: v.string(),
    position: v.optional(v.number()),
    enteredBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.string()),
  })
    .index("by_student_term", ["studentId", "termId"])
    .index("by_class_term", ["classId", "termId"])
    .index("by_class_term_subject", ["classId", "termId", "subjectId"])
    .index("by_term", ["termId"]),

  /** A class's mid-term results for a term, once published to pupils and parents. */
  midtermPublications: defineTable({
    classId: v.id("classes"),
    termId: v.id("terms"),
    publishedAt: v.string(),
    publishedBy: v.optional(v.id("users")),
  })
    .index("by_class_term", ["classId", "termId"])
    .index("by_term", ["termId"]),

  /** The term summary for one pupil. Visible to pupils and parents once published. */
  reportCards: defineTable({
    studentId: v.id("students"),
    termId: v.id("terms"),
    classId: v.id("classes"),
    average: v.number(),
    totalScore: v.number(),
    position: v.number(),
    classSize: v.number(),
    /** Only on report cards published before attendance was dropped. */
    attendancePresent: v.optional(v.number()),
    attendanceTotal: v.optional(v.number()),
    conduct: v.array(v.object({ label: v.string(), rating: v.number() })),
    teacherComment: v.string(),
    headteacherComment: v.string(),
    promotionStatus: v.union(v.literal("promoted"), v.literal("pending"), v.literal("repeat")),
    publishedAt: v.optional(v.string()),
    publishedBy: v.optional(v.id("users")),
  })
    .index("by_student", ["studentId"])
    .index("by_student_term", ["studentId", "termId"])
    .index("by_class_term", ["classId", "termId"])
    .index("by_term", ["termId"]),

  /* --------------------------------- fees --------------------------------- */

  invoices: defineTable({
    invoiceNo: v.string(),
    studentId: v.id("students"),
    termId: v.id("terms"),
    lines: v.array(feeLine),
    total: v.number(),
    amountPaid: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("part_paid"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("void"),
    ),
    issuedAt: v.string(),
    dueDate: v.string(),
  })
    .index("by_student", ["studentId"])
    .index("by_status", ["status"])
    .index("by_invoice_no", ["invoiceNo"]),

  payments: defineTable({
    reference: v.string(),
    invoiceId: v.id("invoices"),
    studentId: v.id("students"),
    amount: v.number(),
    provider: v.union(
      v.literal("paystack"),
      v.literal("flutterwave"),
      v.literal("bank_transfer"),
      v.literal("cash"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("successful"),
      v.literal("failed"),
      v.literal("reversed"),
    ),
    paidAt: v.string(),
    verifiedAt: v.optional(v.string()),
    receiptNo: v.string(),
  })
    .index("by_student", ["studentId"])
    .index("by_invoice", ["invoiceId"])
    .index("by_reference", ["reference"])
    .index("by_paid_at", ["paidAt"]),

  /** A single row: the school account families pay into by transfer. */
  bankDetails: defineTable({
    bankName: v.string(),
    accountNumber: v.string(),
    accountName: v.string(),
    updatedAt: v.string(),
  }),

  /* ------------------------------- admissions ----------------------------- */

  applications: defineTable({
    applicationNo: v.string(),
    sessionId: v.id("academicSessions"),
    intendedLevelId: v.string(),
    status: applicationStatus,
    createdAt: v.string(),
    submittedAt: v.optional(v.string()),
    decidedAt: v.optional(v.string()),
    pupil: v.object({
      firstName: v.string(),
      middleName: v.string(),
      lastName: v.string(),
      dateOfBirth: v.string(),
      gender: v.union(v.literal("Male"), v.literal("Female"), v.literal("")),
      nationality: v.string(),
      previousSchool: v.string(),
      currentClass: v.string(),
      address: v.string(),
      photoUploaded: v.boolean(),
    }),
    guardian: v.object({
      name: v.string(),
      relationship: v.string(),
      phone: v.string(),
      email: v.string(),
      occupation: v.string(),
      address: v.string(),
      emergencyContact: v.string(),
      emergencyPhone: v.string(),
    }),
    documents: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        required: v.boolean(),
        uploaded: v.boolean(),
        fileName: v.optional(v.string()),
        uploadedAt: v.optional(v.string()),
      }),
    ),
    applicationFeePaid: v.boolean(),
    applicationFeeReference: v.optional(v.string()),
    assessment: v.optional(
      v.object({ date: v.string(), time: v.string(), venue: v.string(), score: v.optional(v.number()) }),
    ),
    interview: v.optional(v.object({ date: v.string(), time: v.string(), venue: v.string() })),
    decisionNote: v.optional(v.string()),
    timeline: v.array(
      v.object({ at: v.string(), status: applicationStatus, note: v.string(), actor: v.string() }),
    ),
    ownerEmail: v.string(),
    /** The pupil record created when the applicant was enrolled. */
    studentId: v.optional(v.id("students")),
    /** SHA-256 of the secret kept in the applicant's browser cookie while the draft is open. */
    accessTokenHash: v.optional(v.string()),
  })
    .index("by_access_token", ["accessTokenHash"])
    .index("by_application_no", ["applicationNo"])
    .index("by_owner_email", ["ownerEmail"])
    .index("by_status", ["status"]),

  /* ---------------------------- website content --------------------------- */

  news: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    authorName: v.string(),
    publishedAt: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("archived"),
    ),
    tone: v.string(),
    seoTitle: v.string(),
    seoDescription: v.string(),
    featured: v.boolean(),
    cover: v.optional(cloudMedia),
  })
    .index("by_slug", ["slug"])
    .index("by_status_published", ["status", "publishedAt"]),

  events: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    endDate: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    venue: v.string(),
    category: v.union(
      v.literal("academic"),
      v.literal("sports"),
      v.literal("cultural"),
      v.literal("parents"),
      v.literal("holiday"),
      v.literal("assessment"),
      v.literal("alumni"),
    ),
    requiresRegistration: v.boolean(),
    status: v.union(v.literal("upcoming"), v.literal("past"), v.literal("cancelled")),
    cover: v.optional(cloudMedia),
  })
    .index("by_slug", ["slug"])
    .index("by_date", ["date"]),

  gallery: defineTable({
    title: v.string(),
    caption: v.string(),
    category: v.string(),
    takenAt: v.string(),
    consentCleared: v.boolean(),
    tone: v.string(),
    media: v.optional(cloudMedia),
  }).index("by_taken_at", ["takenAt"]),

  clubs: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    coordinatorId: v.optional(v.id("teachers")),
    meetingDay: v.string(),
    meetingTime: v.string(),
    memberCount: v.number(),
    category: v.union(
      v.literal("stem"),
      v.literal("arts"),
      v.literal("sports"),
      v.literal("literary"),
      v.literal("service"),
    ),
  }),

  /**
   * "Our Stars". The public site shows only initials and the class label;
   * `studentId` is private and links the award to the pupil's portal.
   */
  achievements: defineTable({
    studentInitials: v.string(),
    classLabel: v.string(),
    category: v.string(),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    studentId: v.optional(v.id("students")),
    /** Missing means published (rows created before the field existed). */
    published: v.optional(v.boolean()),
  }).index("by_student", ["studentId"]),

  testimonials: defineTable({
    name: v.string(),
    relationship: v.string(),
    quote: v.string(),
    avatarSeed: v.string(),
  }),

  faqs: defineTable({
    category: v.string(),
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  }),

  documents: defineTable({
    title: v.string(),
    description: v.string(),
    fileName: v.string(),
    sizeBytes: v.number(),
    /** The PDF in Convex file storage. Older records may not have a file yet. */
    storageId: v.optional(v.id("_storage")),
    visibility: v.union(v.literal("public"), v.literal("parents"), v.literal("staff")),
    updatedAt: v.string(),
    category: v.string(),
  }).index("by_visibility", ["visibility"]),

  emergencyNotices: defineTable({
    title: v.string(),
    body: v.string(),
    priority: v.union(v.literal("high"), v.literal("critical")),
    audience: v.union(v.literal("all"), v.literal("parents"), v.literal("staff"), v.literal("pupils")),
    startsAt: v.string(),
    endsAt: v.string(),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  /* ------------------------------- operations ----------------------------- */

  enquiries: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    category: v.union(
      v.literal("admissions"),
      v.literal("fees"),
      v.literal("academics"),
      v.literal("transport"),
      v.literal("general"),
    ),
    message: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("archived"),
    ),
    assignedTo: v.optional(v.string()),
    reply: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_created", ["createdAt"]),

  certificates: defineTable({
    certificateNo: v.string(),
    studentId: v.id("students"),
    award: v.string(),
    sessionName: v.string(),
    issuedAt: v.string(),
    /** Award category (Academic Excellence, Sports, …); older rows have only `award`. */
    category: v.optional(v.string()),
    /** The citation printed under the pupil's name. */
    citation: v.optional(v.string()),
    issuedBy: v.optional(v.id("users")),
    achievementId: v.optional(v.id("achievements")),
    revokedAt: v.optional(v.string()),
    revokedReason: v.optional(v.string()),
  })
    .index("by_certificate_no", ["certificateNo"])
    .index("by_student", ["studentId"]),

  /* ----------------------------- communication ---------------------------- */

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
    createdAt: v.string(),
    read: v.boolean(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_user_read", ["userId", "read"]),

  /** Outbox of notification emails sent through Resend, with the outcome. */
  deliveries: defineTable({
    notificationId: v.optional(v.id("notifications")),
    userId: v.id("users"),
    to: v.string(),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
    /** Button label for the link; defaults to "Open in the portal". */
    cta: v.optional(v.string()),
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    detail: v.optional(v.string()),
    createdAt: v.string(),
    sentAt: v.optional(v.string()),
  })
    .index("by_created", ["createdAt"])
    .index("by_status", ["status"]),

  /* ------------------------------- teaching ------------------------------- */

  /** House points totals, recomputed by a daily job (see convex/gamification.ts). */
  houseStandings: defineTable({
    house: v.union(v.literal("Emerald"), v.literal("Sapphire"), v.literal("Ruby"), v.literal("Amber")),
    points: v.number(),
    pupils: v.number(),
    computedAt: v.string(),
  }).index("by_house", ["house"]),

  timetable: defineTable({
    classId: v.id("classes"),
    day: v.number(),
    period: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    subjectId: v.optional(v.id("subjects")),
    teacherId: v.optional(v.id("teachers")),
    label: v.optional(v.string()),
  })
    .index("by_class", ["classId", "day", "period"])
    .index("by_teacher", ["teacherId", "day", "period"]),

  /* ------------------------------ premium: alumni ----------------------------- */

  alumni: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    graduationYear: v.number(),
    lastClass: v.string(),
    currently: v.optional(v.string()),
    city: v.optional(v.string()),
    /** "parent" when a parent registers a former pupil who is still a child. */
    registeredBy: v.union(v.literal("self"), v.literal("parent")),
    /** Listed in the public alumni directory. Only ever true for adults registering themselves. */
    directoryOptIn: v.boolean(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("declined")),
    createdAt: v.string(),
    decidedAt: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  alumniStories: defineTable({
    slug: v.string(),
    title: v.string(),
    authorName: v.string(),
    graduationYear: v.number(),
    excerpt: v.string(),
    body: v.string(),
    cover: v.optional(cloudMedia),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  /* ------------------------------ website CMS ------------------------------ */

  /** One row per editable website document (identity, homepage, …). Values are validated by `lib/school/cms/schema.ts`. */
  cmsDocuments: defineTable({
    key: v.string(),
    published: v.optional(v.any()),
    publishedAt: v.optional(v.string()),
    publishedBy: v.optional(v.string()),
    draft: v.optional(v.any()),
    draftUpdatedAt: v.optional(v.string()),
    draftUpdatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),

  /** Every published version, newest first, so an earlier one can be restored. */
  cmsVersions: defineTable({
    key: v.string(),
    data: v.any(),
    publishedAt: v.string(),
    publishedBy: v.string(),
    note: v.optional(v.string()),
  }).index("by_key", ["key", "publishedAt"]),

  /** Short-lived tokens that let an editor's browser read drafts on the public website. */
  cmsPreviewTokens: defineTable({
    token: v.string(),
    userId: v.id("users"),
    expiresAt: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  auditLogs: defineTable({
    actorId: v.optional(v.id("users")),
    actorName: v.string(),
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    previousValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    at: v.string(),
    ip: v.string(),
    device: v.string(),
  }).index("by_at", ["at"]),
});
