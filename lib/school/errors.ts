import { ConvexError } from "convex/values";

/** User-facing message from a Convex error thrown in the browser (useMutation / useAction). */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return fallback;
}
