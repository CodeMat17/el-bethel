/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academics from "../academics.js";
import type * as admissions from "../admissions.js";
import type * as alumni from "../alumni.js";
import type * as analytics from "../analytics.js";
import type * as appointments from "../appointments.js";
import type * as assignments from "../assignments.js";
import type * as attendance from "../attendance.js";
import type * as awards from "../awards.js";
import type * as classroom from "../classroom.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as delivery from "../delivery.js";
import type * as directory from "../directory.js";
import type * as fees from "../fees.js";
import type * as gamification from "../gamification.js";
import type * as insights from "../insights.js";
import type * as learning from "../learning.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_delivery from "../lib/delivery.js";
import type * as lib_learning from "../lib/learning.js";
import type * as lib_mappers from "../lib/mappers.js";
import type * as lib_util from "../lib/util.js";
import type * as library from "../library.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as office from "../office.js";
import type * as parentInsights from "../parentInsights.js";
import type * as people from "../people.js";
import type * as premiumSeed from "../premiumSeed.js";
import type * as quizzes from "../quizzes.js";
import type * as reading from "../reading.js";
import type * as results from "../results.js";
import type * as seed from "../seed.js";
import type * as seedMedia from "../seedMedia.js";
import type * as store from "../store.js";
import type * as timetable from "../timetable.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academics: typeof academics;
  admissions: typeof admissions;
  alumni: typeof alumni;
  analytics: typeof analytics;
  appointments: typeof appointments;
  assignments: typeof assignments;
  attendance: typeof attendance;
  awards: typeof awards;
  classroom: typeof classroom;
  content: typeof content;
  crons: typeof crons;
  dashboard: typeof dashboard;
  delivery: typeof delivery;
  directory: typeof directory;
  fees: typeof fees;
  gamification: typeof gamification;
  insights: typeof insights;
  learning: typeof learning;
  "lib/access": typeof lib_access;
  "lib/delivery": typeof lib_delivery;
  "lib/learning": typeof lib_learning;
  "lib/mappers": typeof lib_mappers;
  "lib/util": typeof lib_util;
  library: typeof library;
  messages: typeof messages;
  notifications: typeof notifications;
  office: typeof office;
  parentInsights: typeof parentInsights;
  people: typeof people;
  premiumSeed: typeof premiumSeed;
  quizzes: typeof quizzes;
  reading: typeof reading;
  results: typeof results;
  seed: typeof seed;
  seedMedia: typeof seedMedia;
  store: typeof store;
  timetable: typeof timetable;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
