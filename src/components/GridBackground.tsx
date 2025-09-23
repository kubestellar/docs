"use client";

import { useEffect, useRef } from "react";

interface GridBackgroundProps {
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  className?: string;
  animated?: boolean;
  spacing?: number;
}

export default function GridBackground({
  color = "#6366F1",
  opacity = 0.3,
  strokeWidth = 0.5,
  className = "",
  animated = true,
  spacing = 50,
}: GridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createAnimatedGrid = (container: HTMLElement) => {
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

      // Create pattern for animated grid
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
      pattern.setAttribute("id", `grid-pattern-${Math.random().toString(36).substr(2, 9)}`);
      pattern.setAttribute("width", spacing.toString());
      pattern.setAttribute("height", spacing.toString());
      pattern.setAttribute("patternUnits", "userSpaceOnUse");

      if (animated) {
        const animateTransform = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
        animateTransform.setAttribute("attributeName", "patternTransform");
        animateTransform.setAttribute("type", "translate");
        animateTransform.setAttribute("values", `0,0; ${spacing},${spacing}`);
        animateTransform.setAttribute("dur", "0.6s");
        animateTransform.setAttribute("repeatCount", "indefinite");
        pattern.appendChild(animateTransform);
      }

      // Vertical line
      const verticalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      verticalLine.setAttribute("x1", "0");
      verticalLine.setAttribute("y1", "0");
      verticalLine.setAttribute("x2", "0");
      verticalLine.setAttribute("y2", spacing.toString());
      verticalLine.setAttribute("stroke", color);
      verticalLine.setAttribute("stroke-width", strokeWidth.toString());
      verticalLine.setAttribute("stroke-opacity", opacity.toString());

      // Horizontal line
      const horizontalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      horizontalLine.setAttribute("x1", "0");
      horizontalLine.setAttribute("y1", "0");
      horizontalLine.setAttribute("x2", spacing.toString());
      horizontalLine.setAttribute("y2", "0");
      horizontalLine.setAttribute("stroke", color);
      horizontalLine.setAttribute("stroke-width", strokeWidth.toString());
      horizontalLine.setAttribute("stroke-opacity", opacity.toString());

      pattern.appendChild(verticalLine);
      pattern.appendChild(horizontalLine);
      defs.appendChild(pattern);
      gridSvg.appendChild(defs);

      // Create rectangle that uses the pattern
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", `url(#${pattern.getAttribute("id")})`);
      gridSvg.appendChild(rect);

      container.appendChild(gridSvg);
    };

    if (containerRef.current) {
      createAnimatedGrid(containerRef.current);
    }
  }, [color, opacity, strokeWidth, animated, spacing]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}