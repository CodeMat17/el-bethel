import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

/** Scheduled jobs. Times are UTC (Abuja is UTC+1). */
const crons = cronJobs();

// 06:00 in Abuja: mark overdue library books and remind families.
crons.daily("library reminders", { hourUTC: 5, minuteUTC: 0 }, internal.library.sweep, {});

// 02:00 in Abuja: recompute house points from the day's records.
crons.daily("house points", { hourUTC: 1, minuteUTC: 0 }, internal.gamification.recompute, {});

// Friday 15:30 in Abuja: weekly progress summaries for parents.
crons.weekly("parent insights", { dayOfWeek: "friday", hourUTC: 14, minuteUTC: 30 }, internal.parentInsights.weekly, {});

export default crons;
