"use client";

import { useEffect, useRef, useCallback } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false });

type MermaidProps = {
  children: string;
};

/** Monotonic counter to generate unique IDs for mermaid.render() */
let nextId = 0;

/** Detect whether the page is currently in dark mode */
function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark" ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export const MermaidComponent = ({ children }: MermaidProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const chart = children;

  const renderChart = useCallback(() => {
    if (!ref.current || !chart) return;
    const theme = isDarkMode() ? "dark" : "default";
    mermaid.initialize({ startOnLoad: false, theme });
    const id = `mermaid-${nextId++}`;
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      })
      .catch(console.error);
  }, [chart]);

  useEffect(() => {
    renderChart();

    // Re-render when the user toggles light/dark mode
    const observer = new MutationObserver(renderChart);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", renderChart);

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", renderChart);
    };
  }, [renderChart]);

  if (!chart) {
    return null;
  }

  return <div className="mermaid" ref={ref} />;
};
