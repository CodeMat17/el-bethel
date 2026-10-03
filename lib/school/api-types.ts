import type { FunctionReturnType } from "convex/server";

import type { api } from "@/convex/_generated/api";

/** Shapes returned by Convex queries, for typing page components. */
export type FamilyAssignment = FunctionReturnType<typeof api.assignments.forStudent>[number];
export type StaffAssignment = NonNullable<FunctionReturnType<typeof api.assignments.getForStaff>>;
export type StudentResults = FunctionReturnType<typeof api.results.forStudent>;
