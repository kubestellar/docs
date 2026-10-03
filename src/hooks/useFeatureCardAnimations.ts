"use client";

import { useEffect } from "react";

export interface FeatureCardAnimationsOptions {
  /** CSS selector for feature card elements (default: ".feature-card"). */
  selector?: string;
  /** CSS selector (relative to each card) for the 3D-tilt container (default: ".card-3d-container"). */
  containerSelector?: string;
  /** IntersectionObserver visibility threshold (default: 0.2). */
  threshold?: number;
  /** Per-card stagger delay in ms for the scroll-in animation (default: 150). */
  staggerMs?: number;
  /** Tilt intensity divisor — higher is subtler (default: 15). */
  tiltDivisor?: number;
}

/**
 * useFeatureCardAnimations wires up the scroll-in reveal (IntersectionObserver)
 * and mouse-tilt 3D effect for `.feature-card` elements.
 *
 * Extracted from AboutSection.tsx, which open-coded this imperative DOM logic
 * (observer + injected <style> + mousemove/mouseleave listeners) inline
 * alongside ~490 lines of JSX. Mirrors the useCounterAnimation extraction
 * (#7086/#7087): all observers, injected styles, and listeners are tracked
 * and torn down on cleanup so nothing leaks across remounts.
 */
export function useFeatureCardAnimations(
  options: FeatureCardAnimationsOptions = {}
): void {
  const {
    selector = ".feature-card",
    containerSelector = ".card-3d-container",
    threshold = 0.2,
    staggerMs = 150,
    tiltDivisor = 15,
  } = options;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const featureCards = document.querySelectorAll(selector);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("animate-in");
            }, index * staggerMs);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    featureCards.forEach(card => {
      card.classList.add("opacity-0", "translate-y-10");
      observer.observe(card);
    });

    const style = document.createElement("style");
    style.textContent = `
      .feature-card {
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
      }
      .feature-card.animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      .perspective {
        perspective: 1000px;
      }
      .transform-style-3d {
        transform-style: preserve-3d;
      }
      .rotate-y-10 {
        transform: rotateY(10deg);
      }
    `;
    document.head.appendChild(style);

    const eventHandlers: Array<{
      card: Element;
      handler: (e: Event) => void;
      type: "mousemove" | "mouseleave";
    }> = [];

    featureCards.forEach(card => {
      const moveHandler = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const container = card.querySelector(containerSelector);
        const rect = card.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = (x - centerX) / tiltDivisor;
        const rotateX = (centerY - y) / tiltDivisor;

        if (container) {
          (container as HTMLElement).style.transform =
            `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        }
      };

      const leaveHandler = () => {
        const container = card.querySelector(containerSelector);
        if (container) {
          (container as HTMLElement).style.transform =
            "rotateY(0deg) rotateX(0deg)";
        }
      };

      card.addEventListener("mousemove", moveHandler);
      card.addEventListener("mouseleave", leaveHandler);

      eventHandlers.push({ card, handler: moveHandler, type: "mousemove" });
      eventHandlers.push({ card, handler: leaveHandler, type: "mouseleave" });
    });

    return () => {
      observer.disconnect();
      style.remove();
      eventHandlers.forEach(({ card, handler, type }) => {
        card.removeEventListener(type, handler);
      });
    };
  }, [selector, containerSelector, threshold, staggerMs, tiltDivisor]);
}
