import { v, type Infer } from "convex/values";

export const role = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("teacher"),
  v.literal("parent"),
  v.literal("pupil"),
  /** Bus drivers and attendants: run trips, share the bus location, check riders on and off. */
  v.literal("transport"),
);
export type RoleValue = Infer<typeof role>;

/** A photo or video stored on Cloudinary. Convex keeps only the reference. */
export const cloudMedia = v.object({
  publicId: v.string(),
  url: v.string(),
  resourceType: v.union(v.literal("image"), v.literal("video")),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  format: v.optional(v.string()),
  bytes: v.optional(v.number()),
});
export type CloudMediaValue = Infer<typeof cloudMedia>;

/**
 * An assignment question. The teacher picks the answer format:
 * - "text": a typed answer, marked by the teacher;
 * - "single": radio buttons, one option may be chosen;
 * - "multiple": checkboxes, any number of options may be chosen.
 *
 * `correct` holds the indices of the right options. When it is set on a
 * single/multiple question the answer is marked automatically on submission.
 */
export const question = v.object({
  id: v.string(),
  type: v.union(v.literal("text"), v.literal("single"), v.literal("multiple")),
  prompt: v.string(),
  options: v.array(v.string()),
  correct: v.array(v.number()),
  points: v.number(),
});
export type QuestionValue = Infer<typeof question>;

export const questionAnswer = v.object({
  questionId: v.string(),
  text: v.optional(v.string()),
  selected: v.optional(v.array(v.number())),
  /** Marks awarded. Undefined until the question is marked. */
  awarded: v.optional(v.number()),
  autoMarked: v.optional(v.boolean()),
});
export type QuestionAnswerValue = Infer<typeof questionAnswer>;

export const attendanceStatus = v.union(
  v.literal("present"),
  v.literal("absent"),
  v.literal("late"),
  v.literal("excused"),
);

export const feeLine = v.object({
  category: v.union(
    v.literal("tuition"),
    v.literal("learning_resources"),
    v.literal("activities"),
    v.literal("technology"),
    v.literal("transport"),
    v.literal("meals"),
    v.literal("uniform"),
    v.literal("books"),
    v.literal("registration"),
    v.literal("examination"),
  ),
  label: v.string(),
  amount: v.number(),
});

export const applicationStatus = v.union(
  v.literal("draft"),
  v.literal("submitted"),
  v.literal("under_review"),
  v.literal("documents_required"),
  v.literal("assessment_scheduled"),
  v.literal("assessment_completed"),
  v.literal("interview_scheduled"),
  v.literal("accepted"),
  v.literal("conditionally_accepted"),
  v.literal("waitlisted"),
  v.literal("not_accepted"),
  v.literal("withdrawn"),
  v.literal("enrolled"),
);

/**
 * An online quiz question.
 * - "multiple_choice" / "picture": choose one of `options`; `answer` is the right option.
 *   Picture questions show `imageUrl` above the options.
 * - "true_false": `options` is ["True", "False"].
 * - "short_answer": a typed answer. `answer` lists accepted answers separated by "|";
 *   when it is empty the teacher marks the answer by hand.
 * - "matching": pupils pair each `pairs[i].left` with one of the right-hand items.
 */
export const quizQuestion = v.object({
  id: v.string(),
  type: v.union(
    v.literal("multiple_choice"),
    v.literal("true_false"),
    v.literal("short_answer"),
    v.literal("picture"),
    v.literal("matching"),
  ),
  prompt: v.string(),
  options: v.array(v.string()),
  answer: v.string(),
  points: v.number(),
  imageUrl: v.optional(v.string()),
  pairs: v.optional(v.array(v.object({ left: v.string(), right: v.string() }))),
});
export type QuizQuestionValue = Infer<typeof quizQuestion>;
