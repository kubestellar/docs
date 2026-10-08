"use client";

import { useEffect } from "react";

const DEFAULT_SCROLL_THRESHOLD_PX = 300;

export interface BackToTopOptions {
  /** DOM id of the back-to-top button (default: "back-to-top"). */
  buttonId?: string;
  /** Scroll distance in px after which the button fades in (default: 300). */
  scrollThresholdPx?: number;
  /** When false, the effect is a no-op (e.g. before the component has mounted). */
  enabled?: boolean;
}

/**
 * useBackToTop wires up the "scroll to top" button used by both Footer.tsx
 * and docs/DocsFooter.tsx: it fades the button in/out based on scroll
 * position and scrolls smoothly to the top on click.
 *
 * Extracted because both footers open-coded this same effect independently
 * and had drifted slightly (magic number vs named constant, differing
 * cleanup), the same duplication shape already fixed for the animated
 * counters in #7086 and the GitHub stats hook in #7139.
 */
export function useBackToTop(options: BackToTopOptions = {}): void {
  const {
    buttonId = "back-to-top",
    scrollThresholdPx = DEFAULT_SCROLL_THRESHOLD_PX,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const backToTopButton = document.getElementById(buttonId);
    if (!backToTopButton) return;

    const toggleButton = () => {
      if (window.scrollY > scrollThresholdPx) {
        backToTopButton.style.opacity = "1";
        backToTopButton.style.transform = "translateY(-30px)";
      } else {
        backToTopButton.style.opacity = "0";
        backToTopButton.style.transform = "translateY(10px)";
      }
    };

    const handleClick = () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

    window.addEventListener("scroll", toggleButton);
    backToTopButton.addEventListener("click", handleClick);

    // Initial check
    toggleButton();

    return () => {
      window.removeEventListener("scroll", toggleButton);
      backToTopButton.removeEventListener("click", handleClick);
    };
  }, [buttonId, scrollThresholdPx, enabled]);
}
