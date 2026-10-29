"use client";

import * as React from "react";
import { TriangleAlertIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmergencyNotice } from "@/lib/school/types";

/**
 * Reads the dismissal flag straight from sessionStorage through
 * `useSyncExternalStore`, so the browser-only value is read without
 * synchronising it into state inside an effect. The server snapshot is always
 * "not dismissed", which is also the correct first client paint.
 */
function useDismissed(noticeId: string): [boolean, () => void] {
  const key = `cha-notice-${noticeId}`;
  const listeners = React.useRef(new Set<() => void>());

  const subscribe = React.useCallback((onChange: () => void) => {
    const set = listeners.current;
    set.add(onChange);
    window.addEventListener("storage", onChange);
    return () => {
      set.delete(onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const getSnapshot = React.useCallback(() => {
    try {
      return window.sessionStorage.getItem(key) === "1";
    } catch {
      // Storage can be unavailable (private mode); the banner simply stays visible.
      return false;
    }
  }, [key]);

  const dismissed = React.useSyncExternalStore(subscribe, getSnapshot, () => false);

  const dismiss = React.useCallback(() => {
    try {
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Non-fatal — the banner stays for this page view only.
    }
    for (const listener of listeners.current) listener();
  }, [key]);

  return [dismissed, dismiss];
}

/**
 * The notice whose window covers the current time. Pages are static, so the
 * server can't know "now"; the browser checks on load and once a minute. The
 * server snapshot is "none", so the banner appears right after hydration.
 */
function useLiveNotice(notices: EmergencyNotice[]): EmergencyNotice | null {
  const subscribe = React.useCallback((onChange: () => void) => {
    const timer = window.setInterval(onChange, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const getSnapshot = React.useCallback(() => {
    const now = new Date().toISOString();
    return notices.find((n) => n.startsAt <= now && n.endsAt >= now) ?? null;
  }, [notices]);
  return React.useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function EmergencyBanner({ notices }: { notices: EmergencyNotice[] }) {
  const notice = useLiveNotice(notices);
  return notice ? <NoticeBar key={notice.id} notice={notice} /> : null;
}

function NoticeBar({ notice }: { notice: EmergencyNotice }) {
  const [dismissed, dismiss] = useDismissed(notice.id);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="relative z-50 bg-destructive text-[oklch(0.985_0.01_84)] dark:bg-destructive/90"
    >
      <div className="eb-container flex items-start gap-3 py-2.5 pr-10 text-sm sm:items-center">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 sm:mt-0" />
        <p className="min-w-0">
          <span className="font-extrabold tracking-wide uppercase">{notice.title}</span>
          <span className="mx-2 hidden opacity-50 sm:inline">—</span>
          <span className="block opacity-90 sm:inline">{notice.body}</span>
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss notice"
          className="absolute top-2 right-3 text-current hover:bg-white/15"
          onClick={dismiss}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
