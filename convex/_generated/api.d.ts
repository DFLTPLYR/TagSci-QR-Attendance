/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as attendance from "../attendance.js";
import type * as attendanceLogs from "../attendanceLogs.js";
import type * as auth from "../auth.js";
import type * as dailyPool from "../dailyPool.js";
import type * as http from "../http.js";
import type * as router from "../router.js";
import type * as sessions from "../sessions.js";
import type * as students from "../students.js";
import type * as timetables from "../timetables.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  attendance: typeof attendance;
  attendanceLogs: typeof attendanceLogs;
  auth: typeof auth;
  dailyPool: typeof dailyPool;
  http: typeof http;
  router: typeof router;
  sessions: typeof sessions;
  students: typeof students;
  timetables: typeof timetables;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
