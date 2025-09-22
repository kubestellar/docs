"use client";

import { useEffect, useRef } from "react";

interface GridLinesProps {
  className?: string;
  gridSize?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  speedX?: number;
  speedY?: number;
}

export default function GridLines({
  className = "",
  gridSize = 50,
  strokeColor = "#6366F1",
  strokeOpacity = 0.2,
  strokeWidth = 0.5,
  speedX = 0.1,
  speedY = 0.1,
}: GridLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const { devicePixelRatio: ratio = 1 } = window;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
    };

    const drawGrid = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = strokeOpacity;
      ctx.lineWidth = strokeWidth;

      const offsetX = (Date.now() * speedX) % gridSize;
      const offsetY = (Date.now() * speedY) % gridSize;

      for (let x = offsetX; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }

      for (let y = offsetY; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }
    };

    const animate = () => {
      drawGrid();
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridSize, strokeColor, strokeOpacity, strokeWidth, speedX, speedY]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
    />
  );
}