"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Returns the hydration-safe `mounted` flag and derived `isDark` boolean
 * open-coded (as `useState`/`useEffect`/`resolvedTheme`) independently in
 * `DocsBanner.tsx`, `DocsNavbar.tsx`, `MobileSidebarToggle.tsx`,
 * `SidebarFooter.tsx`, and `ThemeToggle.tsx`. `resolvedTheme` is undefined on
 * the server and on the first client render, so components gate on
 * `mounted` (set `true` only after the first effect runs) to avoid a
 * hydration mismatch — some early-return before `mounted`, others fold it
 * into `isDark` directly; both are equivalent to `mounted && resolvedTheme
 * === "dark"`, which is what this hook returns alongside `mounted` itself
 * for callers that still need the raw flag for an early return.
 *
 * Extracted as the same duplication shape already fixed for `useBackToTop`
 * (#7086, #7139) and `useIsDarkMounted` (#7410).
 */
export function useHydratedTheme(): { mounted: boolean; isDark: boolean } {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return { mounted, isDark: mounted && resolvedTheme === "dark" };
}
