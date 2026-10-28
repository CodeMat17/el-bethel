import "server-only";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { forbidden, notFound, unauthorized } from "next/navigation";

/**
 * Server-side bridge to Convex. Every call carries the signed-in user's Clerk
 * token, so Convex — not this server — decides what the caller may read or do.
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export type ConvexErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "CONFLICT";

/** The Clerk session token minted for Convex, or undefined when signed out. Cached per request. */
export const getConvexToken = cache(async (): Promise<string | undefined> => {
  const session = await auth();
  if (!session.userId) return undefined;
  // With Clerk's native Convex integration the session token already targets Convex;
  // older instances use a JWT template named "convex".
  if (session.sessionClaims?.aud === "convex") return (await session.getToken()) ?? undefined;
  // Minting a template token is a network call to Clerk; retry brief connection drops.
  for (let attempt = 1; ; attempt++) {
    try {
      return (await session.getToken({ template: "convex" })) ?? undefined;
    } catch (error) {
      // Clerk's API errors often arrive with an empty message; surface what it actually said.
      const e = error as { status?: number; errors?: { code?: string; message?: string; longMessage?: string }[] };
      const detail = e.errors?.map((x) => x.longMessage ?? x.message ?? x.code).join("; ") || "no details";
      if (!e.status) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 300 * attempt));
          continue;
        }
        throw new Error(`Could not reach Clerk to mint a Convex token (${detail}). Check this server's internet connection.`, {
          cause: error,
        });
      }
      throw new Error(
        `Clerk could not mint a Convex token (status ${e.status}: ${detail}). ` +
          `Enable Clerk Dashboard → Integrations → Convex, or create a JWT template named "convex".`,
        { cause: error },
      );
    }
  }
});

function client(token: string | undefined): ConvexHttpClient {
  if (!CONVEX_URL) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to configure Convex.");
  const c = new ConvexHttpClient(CONVEX_URL);
  if (token) c.setAuth(token);
  return c;
}

export function convexErrorCode(error: unknown): ConvexErrorCode | null {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: ConvexErrorCode } | string;
    if (typeof data === "object" && data?.code) return data.code;
  }
  return null;
}

export function convexErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return fallback;
}

/** Translate access errors into Next.js navigation interrupts for pages. */
function interrupt(error: unknown): never {
  switch (convexErrorCode(error)) {
    case "UNAUTHENTICATED":
      unauthorized();
    case "FORBIDDEN":
      forbidden();
    case "NOT_FOUND":
      notFound();
    default:
      throw error;
  }
}

type Q = FunctionReference<"query">;
type M = FunctionReference<"mutation">;
type A = FunctionReference<"action">;

/** Run a Convex query as the signed-in user. Access errors become 401/403/404 pages. */
export async function query<F extends Q>(fn: F, args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
  try {
    const c = client(await getConvexToken());
    return await (c.query as (f: F, a: FunctionArgs<F>) => Promise<FunctionReturnType<F>>)(fn, args);
  } catch (error) {
    interrupt(error);
  }
}

/** Run a public Convex query without any identity (website pages). */
export async function publicQuery<F extends Q>(fn: F, args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
  const c = client(undefined);
  return await (c.query as (f: F, a: FunctionArgs<F>) => Promise<FunctionReturnType<F>>)(fn, args);
}

/** Run a Convex mutation as the signed-in user. Errors are thrown to the caller. */
export async function mutation<F extends M>(fn: F, args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
  const c = client(await getConvexToken());
  return await (c.mutation as (f: F, a: FunctionArgs<F>) => Promise<FunctionReturnType<F>>)(fn, args);
}

/** Run a public Convex mutation without identity (enquiry and admission forms). */
export async function publicMutation<F extends M>(fn: F, args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
  const c = client(undefined);
  return await (c.mutation as (f: F, a: FunctionArgs<F>) => Promise<FunctionReturnType<F>>)(fn, args);
}

export async function action<F extends A>(fn: F, args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
  const c = client(await getConvexToken());
  return await (c.action as (f: F, a: FunctionArgs<F>) => Promise<FunctionReturnType<F>>)(fn, args);
}

export type MutationResult<T> = { ok: true; data: T } | { ok: false; message: string; code: ConvexErrorCode | null };

/** Run a mutation and turn failures into a user-facing message instead of throwing. */
export async function tryMutation<F extends M>(
  fn: F,
  args: FunctionArgs<F>,
): Promise<MutationResult<FunctionReturnType<F>>> {
  try {
    return { ok: true, data: await mutation(fn, args) };
  } catch (error) {
    console.error(error);
    return { ok: false, message: convexErrorMessage(error), code: convexErrorCode(error) };
  }
}
