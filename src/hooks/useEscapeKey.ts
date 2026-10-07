"use client";

import { useEffect } from "react";

/**
 * useEscapeKey closes an open dropdown on the Escape key. Shared by
 * VersionSelector and LanguageSwitcher, which each used to hand-roll an
 * identical `document.addEventListener("keydown", ...)` listener.
 *
 * `enabled` lets a caller only attach the listener while the dropdown is
 * actually open (LanguageSwitcher's prior behavior); omit it to attach
 * unconditionally (VersionSelector's prior behavior).
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscape();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onEscape, enabled]);
}
