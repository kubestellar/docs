"use client";

import { useEffect } from "react";

export interface CounterAnimationOptions {
  /** CSS selector for counter elements (default: ".counter"). */
  selector?: string;
  /** Total animation duration in ms (default: 2000). */
  durationMs?: number;
  /** Frame interval in ms (default: 16 ≈ 60fps). */
  tickMs?: number;
  /** Attribute name holding the target integer (default: "data-target"). */
  targetAttr?: string;
  /**
   * Optional root to query. Defaults to `document`. Kept as a parameter so
   * tests can pass a scoped element instead of leaking across the JSDOM tree.
   */
  root?: Document | HTMLElement;
}

/**
 * useCounterAnimation animates the numeric text of every element matching
 * `selector` from 0 up to the integer stored in its `data-target` attribute.
 *
 * Extracted from HeroSection.tsx and HowToUseSection.tsx (see #7086), which
 * both open-coded the same loop and — critically — did not track the
 * per-element intervals for cleanup, causing a setInterval leak per remount.
 * This hook keeps every timer in a local array and clears them all when the
 * effect tears down.
 */
export function useCounterAnimation(options: CounterAnimationOptions = {}): void {
  const {
    selector = ".counter",
    durationMs = 2000,
    tickMs = 16,
    targetAttr = "data-target",
    root,
  } = options;

  useEffect(() => {
    const scope =
      root ?? (typeof document === "undefined" ? undefined : document);
    if (!scope) return;

    const timers: ReturnType<typeof setInterval>[] = [];
    const counters = scope.querySelectorAll<HTMLElement>(selector);

    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute(targetAttr) ?? "0", 10);
      const step = target / (durationMs / tickMs);
      let current = 0;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        counter.textContent = Math.floor(current).toString();
      }, tickMs);

      timers.push(timer);
    });

    return () => {
      timers.forEach(clearInterval);
    };
  }, [selector, durationMs, tickMs, targetAttr, root]);
}
