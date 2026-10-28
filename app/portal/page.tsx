import { redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";

import { getSessionUser, homeForUser, NO_ACCESS } from "@/lib/school/auth";

export default async function PortalIndex() {
  const user = await getSessionUser();
  if (user) redirect(homeForUser(user));
  // Signed in with Clerk, but no active school account is linked to this sign-in yet.
  const { userId } = await auth();
  redirect(userId ? NO_ACCESS : "/login");
}
