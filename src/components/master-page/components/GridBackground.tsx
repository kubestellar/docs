"use client";

import { useEffect } from "react";

interface GridBackgroundProps {
  id: string;
  horizontalLines?: number;
  verticalLines?: number;
  strokeColor?: string;
  strokeWidth?: string;
  strokeOpacity?: string;
  lineSpacing?: number;
  className?: string;
}

export default function GridBackground({
  id,
  horizontalLines = 12,
  verticalLines = 12,
  strokeColor = "#6366F1",
  strokeWidth = "0.5",
  strokeOpacity = "0.3",
  lineSpacing = 8,
  className = "absolute inset-0 opacity-20",
}: GridBackgroundProps) {
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

      for (let i = 0; i < horizontalLines; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", "0");
        line.setAttribute("y1", `${i * lineSpacing}%`);
        line.setAttribute("x2", "100%");
        line.setAttribute("y2", `${i * lineSpacing}%`);
        line.setAttribute("stroke", strokeColor);
        line.setAttribute("stroke-width", strokeWidth);
        line.setAttribute("stroke-opacity", strokeOpacity);
        gridSvg.appendChild(line);
      }

      for (let i = 0; i < verticalLines; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", `${i * lineSpacing}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("x2", `${i * lineSpacing}%`);
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", strokeColor);
        line.setAttribute("stroke-width", strokeWidth);
        line.setAttribute("stroke-opacity", strokeOpacity);
        gridSvg.appendChild(line);
      }

      container.appendChild(gridSvg);
    };

    const gridContainer = document.getElementById(id);
    if (gridContainer) {
      createGrid(gridContainer);
    }
  }, [id, horizontalLines, verticalLines, strokeColor, strokeWidth, strokeOpacity, lineSpacing]);

  return <div id={id} className={className}></div>;
}