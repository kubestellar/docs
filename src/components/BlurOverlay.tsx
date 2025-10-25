"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";

interface BlurOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function BlurOverlay({ isVisible, onClose }: BlurOverlayProps) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll on mobile
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
      document.body.style.top = "unset";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
      document.body.style.top = "unset";
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`fixed inset-0 z-40 backdrop-blur-sm transition-all duration-300 ${
        isDark ? "bg-black/30" : "bg-black/20"
      }`}
      onClick={onClose}
      onTouchEnd={onClose}
      aria-hidden="true"
      role="button"
      tabIndex={-1}
      style={{
        // Mobile-specific optimizations
        WebkitBackfaceVisibility: "hidden",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        // Prevent touch scrolling on mobile
        touchAction: "none",
        // Optimize for mobile performance
        willChange: "opacity, backdrop-filter",
      }}
    />
  );
}
