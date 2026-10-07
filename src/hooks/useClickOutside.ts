"use client";

import { useEffect, type RefObject } from "react";

/**
 * useClickOutside closes an open dropdown/popover when the user presses the
 * mouse down outside of it. Shared by VersionSelector, LanguageSwitcher,
 * ContributorHoverCard, and the marketplace page's tag filter, which each
 * used to hand-roll an identical `document.addEventListener("mousedown", ...)`
 * listener with a ref-containment check.
 *
 * `extraRefs` lets a caller (e.g. LanguageSwitcher, which also guards its
 * own toggle button) treat more than one element as "inside".
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  extraRefs: RefObject<HTMLElement | null>[] = []
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (extraRefs.some((r) => r.current && r.current.contains(target))) return;
      if (!ref.current) return;
      onOutside();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, onOutside, ...extraRefs]);
}
