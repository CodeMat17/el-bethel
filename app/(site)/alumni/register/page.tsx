import type { Metadata } from "next";

import { PageHero } from "@/components/common";
import { AlumniRegisterForm } from "@/components/site/alumni-forms";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Register as Alumni",
  description: "Former pupils of El-Bethel International Academy — or their parents — can register to stay in touch.",
  alternates: { canonical: "/alumni/register" },
};

export default function AlumniRegisterPage() {
  return (
    <>
      <PageHero
        eyebrow="Alumni"
        title="Register as alumni"
        lede="Tell us how to reach you. The alumni office checks each registration against our records before it's confirmed."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Alumni", href: "/alumni" },
          { label: "Register", href: "/alumni/register" },
        ]}
      />
      <section className="eb-section">
        <div className="eb-container max-w-3xl">
          <Card className="gap-0 p-6 sm:p-8">
            <AlumniRegisterForm />
          </Card>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            We use these details only for alumni news, events and giving. See our privacy notice. You can ask us to remove them at any time.
          </p>
        </div>
      </section>
    </>
  );
}
