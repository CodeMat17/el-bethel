import Link from "next/link";
import { ClockIcon, MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";

import { Brand } from "@/components/site/brand";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Separator } from "@/components/ui/separator";
import { SCHOOL } from "@/lib/school/config";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "About",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Vision & Mission", href: "/about/vision-mission" },
      { label: "Core Values", href: "/about/core-values" },
      { label: "School Anthem", href: "/about/anthem" },
      { label: "Headteacher's Message", href: "/about/headteacher" },
      { label: "Leadership", href: "/about/leadership" },
      { label: "Our Teachers", href: "/about/teachers" },
    ],
  },
  {
    title: "Admissions",
    links: [
      { label: "Why El-Bethel", href: "/admissions/why-el-bethel" },
      { label: "Admission Process", href: "/admissions/process" },
      { label: "Requirements", href: "/admissions/requirements" },
      { label: "Fees", href: "/admissions/fees" },
      { label: "Apply Online", href: "/admissions/apply" },
      { label: "Check Status", href: "/admissions/status" },
    ],
  },
  {
    title: "School Life",
    links: [
      { label: "Clubs & Activities", href: "/school-life/clubs" },
      { label: "Sports", href: "/school-life/sports" },
      { label: "Facilities", href: "/school-life/facilities" },
      { label: "Events", href: "/school-life/events" },
      { label: "Gallery", href: "/school-life/gallery" },
      { label: "Our Stars", href: "/school-life/achievements" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "News & Updates", href: "/news" },
      { label: "School Calendar", href: "/calendar" },
      { label: "Documents", href: "/documents" },
      { label: "Careers", href: "/careers" },
      { label: "Book a Tour", href: "/contact/tour" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const SOCIALS: { label: string; href: string; path: string }[] = [
  { label: "Facebook", href: SCHOOL.social.facebook, path: "M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1Z" },
  { label: "Instagram", href: SCHOOL.social.instagram, path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.5-1.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" },
  { label: "YouTube", href: SCHOOL.social.youtube, path: "M21.6 7.2c-.2-1-.9-1.7-1.9-2C18 4.8 12 4.8 12 4.8s-6 0-7.7.4c-1 .3-1.7 1-1.9 2C2 9 2 12 2 12s0 3 .4 4.8c.2 1 .9 1.7 1.9 2 1.7.4 7.7.4 7.7.4s6 0 7.7-.4c1-.3 1.7-1 1.9-2 .4-1.8.4-4.8.4-4.8s0-3-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z" },
  { label: "X", href: SCHOOL.social.x, path: "M17.5 3h3l-6.6 7.6L21.8 21h-5.9l-4.3-5.7L6.4 21H3.3l7-8L2.6 3h6l3.9 5.2L17.5 3Z" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy text-navy-foreground">
      <div className="eb-container py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Brand className="[&_span]:text-navy-foreground" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-foreground/70">
              A private creche, nursery, primary and junior secondary school in Abuja providing quality, child-centred education
              in a safe, stimulating and technology-enabled environment.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-navy-foreground/80">
              <li className="flex items-start gap-3">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>{SCHOOL.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon className="size-4 shrink-0 text-gold" />
                <span className="flex flex-wrap gap-x-2">
                  <a href={`tel:${SCHOOL.phoneHref}`} className="hover:text-navy-foreground">{SCHOOL.phone}</a>
                  <span aria-hidden>·</span>
                  <a href={`tel:${SCHOOL.phoneAltHref}`} className="hover:text-navy-foreground">{SCHOOL.phoneAlt}</a>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircleIcon className="size-4 shrink-0 text-gold" />
                <a href={SCHOOL.whatsappHref} target="_blank" rel="noreferrer noopener" className="hover:text-navy-foreground">WhatsApp {SCHOOL.whatsapp}</a>
              </li>
              <li className="flex items-center gap-3">
                <MailIcon className="size-4 shrink-0 text-gold" />
                <a href={`mailto:${SCHOOL.email}`} className="hover:text-navy-foreground">{SCHOOL.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>{SCHOOL.officeHours}</span>
              </li>
            </ul>

            <div className="mt-6 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="grid size-10 place-items-center rounded-xl bg-navy-foreground/10 text-navy-foreground/80 transition-colors hover:bg-gold hover:text-gold-foreground"
                >
                  <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <h3 className="text-[0.68rem] font-extrabold tracking-[0.16em] text-gold uppercase">
                    {col.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-navy-foreground/70 transition-colors hover:text-navy-foreground"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-navy-foreground/[0.06] p-5 ring-1 ring-navy-foreground/10">
              <h3 className="font-heading text-base font-extrabold">Stay in the loop</h3>
              <p className="mt-1 text-sm text-navy-foreground/70">
                Termly newsletters, event reminders and admission updates — never more than twice a month.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-navy-foreground/15" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-navy-foreground/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
            <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">Demo data</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-navy-foreground">Privacy & Child Protection</Link>
            <Link href="/terms" className="hover:text-navy-foreground">Terms of Use</Link>
            <Link href="/accessibility" className="hover:text-navy-foreground">Accessibility</Link>
            <Link href="/sitemap.xml" className="hover:text-navy-foreground">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
