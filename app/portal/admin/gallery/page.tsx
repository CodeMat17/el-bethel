import type { Metadata } from "next";
import { ShieldCheckIcon, UploadIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { ToneImage } from "@/components/motion";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/school/auth";
import { getGallery } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  await requireAdmin();
  const gallery = getGallery();
  const categories = Array.from(new Set(gallery.map((g) => g.category)));

  return (
    <>
      <PortalPageHeader
        title="Gallery"
        description="Photographs published to the public website, with consent status for each image."
        action={
          <Button size="lg" className="font-bold" disabled>
            <UploadIcon />
            Upload images
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Images" value={gallery.length} icon="Images" tone="info" />
        <StatCard label="Categories" value={categories.length} icon="Layers" tone="neutral" />
        <StatCard
          label="Consent cleared"
          value={gallery.filter((g) => g.consentCleared).length}
          icon="ShieldCheck"
          tone="success"
        />
        <StatCard
          label="Awaiting consent"
          value={gallery.filter((g) => !g.consentCleared).length}
          icon="CircleAlert"
          tone={gallery.some((g) => !g.consentCleared) ? "warning" : "success"}
        />
      </div>

      <Card className="mb-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="flex items-start gap-3 text-sm leading-relaxed">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            An image containing an identifiable child is published only where the family has given
            consent, and that consent is recorded against the image. Withdrawing consent removes the
            image from the public site immediately.
          </span>
        </p>
      </Card>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((item) => (
          <li key={item.id}>
            <Card className="gap-0 overflow-hidden p-0">
              <ToneImage tone={item.tone} seed={item.id} label={item.title} className="aspect-square" />
              <div className="p-3">
                <p className="line-clamp-2 text-xs font-bold">{item.title}</p>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                  {item.category} · {formatDate(item.takenAt)}
                </p>
                <div className="mt-2">
                  <StatusPill tone={item.consentCleared ? "success" : "warning"}>
                    {item.consentCleared ? "Consent on file" : "Consent pending"}
                  </StatusPill>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
