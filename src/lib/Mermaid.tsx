"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

type MermaidProps = {
  children: string;
};

export const MermaidComponent = ({ children }: MermaidProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const chart = children;

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute("data-processed");
      ref.current.textContent = chart;
      mermaid.run({ nodes: [ref.current] }).catch(console.error);
    }
  }, [chart]);

  if (!chart) {
    return null;
  }

  return (
    <div
      className="mermaid dark:invert dark:hue-rotate-180"
      ref={ref}
    />
  );
};
