import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Optimistic gate only: signed-out visitors to the portals are sent to sign in.
 * Real authorization happens in Convex on every query and mutation.
 */
const isPortal = createRouteMatcher(["/portal(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isPortal(request)) await auth.protect();
  },
  { signInUrl: "/login" },
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
