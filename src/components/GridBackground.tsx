"use client";

import { useEffect, useRef } from "react";

interface GridBackgroundProps {
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  className?: string;
}

export default function GridBackground({
  color = "#6366F1",
  opacity = 0.3,
  strokeWidth = 0.5,
  className = "",
}: GridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createGrid = (container: HTMLElement) => {
      if (!container) return;
      container.innerHTML = "";

      const gridSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      gridSvg.setAttribute("width", "100%");
      gridSvg.setAttribute("height", "100%");
      gridSvg.style.position = "absolute";
      gridSvg.style.top = "0";
      gridSvg.style.left = "0";

      for (let i = 0; i < 8; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", "0");
        line.setAttribute("y1", `${i * 12}%`);
        line.setAttribute("x2", "100%");
        line.setAttribute("y2", `${i * 12}%`);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", strokeWidth.toString());
        line.setAttribute("stroke-opacity", opacity.toString());
        gridSvg.appendChild(line);
      }

      for (let i = 0; i < 8; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", `${i * 12}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("x2", `${i * 12}%`);
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", strokeWidth.toString());
        line.setAttribute("stroke-opacity", opacity.toString());
        gridSvg.appendChild(line);
      }

      container.appendChild(gridSvg);
    };

    if (containerRef.current) {
      createGrid(containerRef.current);
    }
  }, [color, opacity, strokeWidth]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
    />
  );
}