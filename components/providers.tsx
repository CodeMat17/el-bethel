"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="cha-theme"
    >
      <TooltipProvider delay={200}>
        {children}
        <Toaster position="top-center" richColors closeButton expand />
      </TooltipProvider>
    </ThemeProvider>
  );
}
