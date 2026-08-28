"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, LogOutIcon, MenuIcon } from "lucide-react";

import { Icon } from "@/components/icon";
import { BrandMark } from "@/components/site/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAction } from "@/lib/school/actions/auth";
import type { PortalNavGroup } from "@/lib/school/navigation";
import { avatarTone, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export interface PortalUser {
  name: string;
  email: string;
  roleLabel: string;
  avatarSeed: string;
}

export function PortalShell({
  portalName,
  portalHome,
  nav,
  user,
  unread,
  notificationsHref,
  quickNav,
  headerExtra,
  children,
}: {
  portalName: string;
  portalHome: string;
  nav: PortalNavGroup[];
  user: PortalUser;
  unread: number;
  notificationsHref: string;
  quickNav?: { label: string; href: string; icon: string }[];
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) =>
    href === portalHome ? pathname === href : pathname.startsWith(href);

  const navList = (
    <nav className="flex-1 space-y-6 px-3 py-4" aria-label={`${portalName} navigation`}>
      {nav.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-[0.62rem] font-extrabold tracking-[0.16em] text-sidebar-foreground/45 uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon name={item.icon} className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const accountBlock = (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className={cn("text-xs font-bold", avatarTone(user.avatarSeed))}>
            {initials(...user.name.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-sidebar-foreground">{user.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/55">{user.roleLabel}</p>
        </div>
      </div>
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="lg"
          className="mt-1 h-10 w-full justify-start font-bold text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOutIcon />
          Sign out
        </Button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
          <BrandMark className="size-9" />
          <div className="min-w-0">
            <p className="truncate font-heading text-sm leading-tight font-extrabold text-sidebar-foreground">
              Crestwood
            </p>
            <p className="truncate text-[0.65rem] font-bold tracking-wide text-sidebar-primary uppercase">
              {portalName}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{navList}</div>
        {accountBlock}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg supports-backdrop-filter:bg-background/70">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={<Button variant="outline" size="icon-lg" className="lg:hidden" aria-label="Open menu" />}
              >
                <MenuIcon className="size-[1.15rem]" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(19rem,86vw)] gap-0 border-sidebar-border bg-sidebar p-0">
                <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-4">
                  <SheetTitle className="flex items-center gap-2.5 text-left">
                    <BrandMark className="size-9" />
                    <span className="min-w-0">
                      <span className="block truncate font-heading text-sm leading-tight font-extrabold text-sidebar-foreground">
                        Crestwood
                      </span>
                      <span className="block truncate text-[0.65rem] font-bold tracking-wide text-sidebar-primary uppercase">
                        {portalName}
                      </span>
                    </span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">Portal navigation</SheetDescription>
                </SheetHeader>
                {/* Closing on click keeps the tray in step with navigation without an effect. */}
                <div className="flex-1 overflow-y-auto overscroll-contain" onClick={() => setOpen(false)}>
                  {navList}
                </div>
                {accountBlock}
              </SheetContent>
            </Sheet>

            <Link href={portalHome} className="flex items-center gap-2 lg:hidden">
              <span className="font-heading text-sm font-extrabold">{portalName}</span>
            </Link>

            <div className="ml-auto flex items-center gap-1">
              {headerExtra}
              <Button
                variant="ghost"
                size="icon-lg"
                className="relative"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                render={<Link href={notificationsHref} />}
              >
                <BellIcon className="size-[1.15rem]" />
                {unread > 0 ? (
                  <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.6rem] font-extrabold text-[oklch(0.985_0.01_84)]">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Button>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-lg" className="ml-0.5" aria-label="Account menu" />}
                >
                  <Avatar className="size-8">
                    <AvatarFallback className={cn("text-[0.7rem] font-bold", avatarTone(user.avatarSeed))}>
                      {initials(...user.name.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/" />}>Public website</DropdownMenuItem>
                  <DropdownMenuItem render={<Link href={notificationsHref} />}>Notifications</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={logoutAction} className="p-1">
                    <button
                      type="submit"
                      className="flex min-h-9 w-full items-center rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Sign out
                    </button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-8">{children}</main>

        {/* Mobile quick nav */}
        {quickNav && quickNav.length > 0 ? (
          <nav
            aria-label="Quick navigation"
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-lg lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <ul className="grid grid-cols-5">
              {quickNav.slice(0, 5).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.65rem] font-bold transition-colors",
                      isActive(item.href) ? "text-primary dark:text-gold" : "text-muted-foreground",
                    )}
                  >
                    <Icon name={item.icon} className="size-5" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
