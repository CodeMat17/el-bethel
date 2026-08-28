import { redirect } from "next/navigation";

import { getSessionUser, homeForUser } from "@/lib/school/auth";

export default async function PortalIndex() {
  const user = await getSessionUser();
  redirect(user ? homeForUser(user) : "/login");
}
