"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  LogInIcon,
  MailIcon,
  MessageCircleIcon,
  MenuIcon,
  PhoneIcon,
  SearchIcon,
} from "lucide-react";

import { Icon } from "@/components/icon";
import { Brand } from "@/components/site/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteSearch } from "@/components/site/site-search";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { School } from "@/lib/school/cms/tokens";
import { PUBLIC_NAV } from "@/lib/school/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader({ school: SCHOOL }: { school: School }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href?: string) =>
    href ? (href === "/" ? pathname === "/" : pathname.startsWith(href)) : false;

  return (
    <header className="sticky top-0 z-50">   

      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled
            ? "border-border bg-background/85 shadow-sm backdrop-blur-lg supports-backdrop-filter:bg-background/70"
            : "border-transparent bg-background",
        )}
      >
        <div className="eb-container flex h-16 items-center gap-3 lg:h-[4.5rem]">
          <Brand className="mr-auto" school={SCHOOL} />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {PUBLIC_NAV.map((section) =>
              section.items ? (
                <Popover
                  key={section.label}
                  open={openMenu === section.label}
                  onOpenChange={(next) => setOpenMenu(next ? section.label : null)}
                >
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                          "gap-1 px-3 text-sm font-semibold",
                          isActive(section.href) && "text-primary dark:text-gold",
                        )}
                      />
                    }
                  >
                    {section.label}
                    <ChevronDownIcon className="size-3.5 opacity-60 transition-transform in-aria-expanded:rotate-180" />
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={10}
                    className={cn("p-2", section.featured ? "w-[38rem]" : "w-[22rem]")}
                  >
                    {/* Closing on click keeps the menu in step with navigation without an effect. */}
                    <div
                      className={cn("grid gap-1", section.featured && "grid-cols-[1fr_15rem]")}
                      onClick={() => setOpenMenu(null)}
                    >
                      <div className="grid gap-0.5 sm:grid-cols-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent"
                          >
                            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-gold/20 group-hover:text-gold-foreground dark:group-hover:text-gold">
                              <Icon name={item.icon ?? "Sparkles"} className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">{item.label}</span>
                              {item.description ? (
                                <span className="block text-xs leading-snug text-muted-foreground">
                                  {item.description}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        ))}
                      </div>
                      {section.featured ? (
                        <Link
                          href={section.featured.href}
                          className="flex flex-col justify-between rounded-lg bg-navy p-4 text-navy-foreground transition-transform hover:-translate-y-0.5"
                        >
                          <span>
                            <span className="block font-heading text-base font-extrabold text-gold">
                              {section.featured.title}
                            </span>
                            <span className="mt-1.5 block text-xs leading-relaxed opacity-80">
                              {section.featured.text}
                            </span>
                          </span>
                          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-gold">
                            {section.featured.cta} <ArrowRightIcon className="size-3.5" />
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button
                  key={section.label}
                  variant="ghost"
                  size="lg"
                  className={cn("px-3 text-sm font-semibold", isActive(section.href) && "text-primary dark:text-gold")}
                  render={<Link href={section.href ?? "/"} />}
                >
                  {section.label}
                </Button>
              ),
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <SiteSearch>
              <Button variant="ghost" size="icon-lg" aria-label="Search the website">
                <SearchIcon className="size-[1.15rem]" />
              </Button>
            </SiteSearch>
            <ThemeToggle />
            <Button
              className="ml-1 hidden font-bold sm:inline-flex"
              size="lg"
              render={<Link href="/portal" />}
            >
              Portal login
              <LogInIcon />
            </Button>
            <Button
              className="ml-1 hidden bg-gold font-bold text-gold-foreground hover:bg-gold/85 xl:inline-flex"
              size="lg"
              render={<Link href="/admissions/apply" />}
            >
              Apply now
            </Button>

            {/* Mobile navigation tray */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={<Button variant="outline" size="icon-lg" className="lg:hidden" aria-label="Open menu" />}
              >
                <MenuIcon className="size-[1.15rem]" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(22rem,88vw)] gap-0 p-0 sm:max-w-sm">
                <SheetHeader className="border-b px-4 py-4">
                  <SheetTitle className="text-left">
                    <Brand compact />
                  </SheetTitle>
                  <SheetDescription className="sr-only">Site navigation</SheetDescription>
                </SheetHeader>

                {/* Only link clicks close the tray — accordion triggers must stay live. */}
                <div
                  className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) setOpen(false);
                  }}
                >
                  <Accordion className="w-full">
                    {PUBLIC_NAV.map((section) =>
                      section.items ? (
                        <AccordionItem key={section.label} value={section.label}>
                          <AccordionTrigger className="py-3.5 text-sm font-bold">
                            {section.label}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-0.5 pb-2">
                              {section.items.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-accent"
                                >
                                  <Icon name={item.icon ?? "Sparkles"} className="size-4 text-muted-foreground" />
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ) : (
                        <Link
                          key={section.label}
                          href={section.href ?? "/"}
                          className="flex min-h-12 items-center border-b text-sm font-bold"
                        >
                          {section.label}
                        </Link>
                      ),
                    )}
                  </Accordion>

                </div>

                <div className="grid gap-2 border-t bg-muted/40 p-4">
                  <Button
                    size="lg"
                    className="h-11 w-full bg-gold font-bold text-gold-foreground hover:bg-gold/85"
                    render={<Link href="/admissions/apply" />}
                  >
                    Apply for admission
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 w-full font-bold"
                    render={<Link href="/portal" />}
                  >
                    Portal login
                  </Button>
                  <a
                    href={`tel:${SCHOOL.phoneHref}`}
                    className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <PhoneIcon className="size-3.5" /> {SCHOOL.phone}
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
