import type { Metadata } from "next";

import { ThreadPage } from "@/components/portal/thread-page";
import { requireParent } from "@/lib/school/auth";

export const metadata: Metadata = { title: "Conversation" };

export default async function ParentThreadPage({ params }: PageProps<"/portal/parent/messages/[id]">) {
  await requireParent();
  const { id } = await params;
  return <ThreadPage id={id} basePath="/portal/parent/messages" />;
}
