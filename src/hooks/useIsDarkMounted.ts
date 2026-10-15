"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Returns the hydration-safe "is dark theme" boolean used by
 * `MobileTOC.tsx` and `TableOfContents.tsx`: `resolvedTheme` is undefined
 * on the server and on the first client render, so reading it directly
 * would make the initial client render disagree with the server-rendered
 * markup. Gating on `mounted` (set `true` only after the first effect
 * runs) avoids that mismatch.
 *
 * Extracted because both components open-coded this same
 * `useState`/`useEffect`/`resolvedTheme` triple independently, the same
 * duplication shape already fixed for the back-to-top scroll handler in
 * `useBackToTop.ts` (#7086, #7139).
 */
export function useIsDarkMounted(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && resolvedTheme === "dark";
}
