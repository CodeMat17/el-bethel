import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

/** Scheduled jobs. Times are UTC (Abuja is UTC+1). */
const crons = cronJobs();

// 02:00 in Abuja: recompute house points from the day's records.
crons.daily("house points", { hourUTC: 1, minuteUTC: 0 }, internal.gamification.recompute, {});

export default crons;
