"use client";

import StarField from "../../StarField";

interface BackgroundEffectsProps {
  showStarField?: boolean;
  starDensity?: "low" | "medium" | "high";
  showComets?: boolean;
  cometCount?: number;
  showDarkOverlay?: boolean;
  darkOverlayColor?: string;
  showGradientOverlays?: boolean;
  gradientOverlays?: Array<{
    position: string;
    size: string;
    color: string;
    blur: string;
  }>;
  className?: string;
}

const defaultGradientOverlays = [
  {
    position: "top-2/5 left-2/11",
    size: "w-[6rem] h-[6rem]",
    color: "bg-purple-500/10",
    blur: "blur-[120px]",
  },
  {
    position: "top-4/5 left-1/2",
    size: "w-[10rem] h-[10rem]",
    color: "bg-purple-500/5",
    blur: "blur-[180px]",
  },
];

export default function BackgroundEffects({
  showStarField = true,
  starDensity = "medium",
  showComets = true,
  cometCount = 3,
  showDarkOverlay = true,
  darkOverlayColor = "#0a0a0a",
  showGradientOverlays = false,
  gradientOverlays = defaultGradientOverlays,
  className = "",
}: BackgroundEffectsProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      {showDarkOverlay && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: darkOverlayColor }}
        />
      )}

      {showStarField && (
        <StarField
          density={starDensity}
          showComets={showComets}
          cometCount={cometCount}
        />
      )}

      {showGradientOverlays && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {gradientOverlays.map((overlay, index) => (
            <div
              key={index}
              className={`absolute ${overlay.position} ${overlay.size} ${overlay.color} rounded-full ${overlay.blur}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const BackgroundPresets = {
  hero: {
    showStarField: true,
    starDensity: "high" as const,
    showComets: true,
    cometCount: 8,
    showDarkOverlay: true,
    showGradientOverlays: false,
  },
  section: {
    showStarField: true,
    starDensity: "medium" as const,
    showComets: true,
    cometCount: 3,
    showDarkOverlay: true,
    showGradientOverlays: false,
  },
  contact: {
    showStarField: true,
    starDensity: "medium" as const,
    showComets: true,
    cometCount: 4,
    showDarkOverlay: true,
    showGradientOverlays: true,
    gradientOverlays: [
      {
        position: "top-0 right-0 w-1/3 h-1/3",
        size: "",
        color: "bg-gradient-to-b from-purple-500/10 to-transparent",
        blur: "blur-3xl transform translate-x-1/3 -translate-y-1/3",
      },
      {
        position: "bottom-0 left-0 w-1/3 h-1/3",
        size: "",
        color: "bg-gradient-to-t from-blue-500/10 to-transparent",
        blur: "blur-3xl transform -translate-x-1/3 translate-y-1/3",
      },
    ],
  },
  getStarted: {
    showStarField: true,
    starDensity: "medium" as const,
    showComets: true,
    cometCount: 3,
    showDarkOverlay: true,
    showGradientOverlays: true,
  },
};