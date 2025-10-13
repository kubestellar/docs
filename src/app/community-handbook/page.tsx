"use client";

import { useEffect, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { StarField, GridLines } from "@/components";
import { handbookCards, HandbookCard } from "./handbook";

// Optimized Icon component with memoization
interface IconProps {
  type: string;
  className?: string;
}

// Move iconMap outside component to prevent recreation on every render
const iconMap = {
  "user-plus": {
    path: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    color: "#3B82F6",
  },
  "shield-check": {
    path: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "#A855F7",
  },
  "document-text": {
    path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "#22C55E",
  },
  "lock-closed": {
    path: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    color: "#EAB308",
  },
  users: {
    path: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    color: "#06B6D4",
  },
  "check-circle": {
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#EF4444",
  },
  cube: {
    path: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    color: "#6366F1",
  },
  "book-open": {
    path: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    color: "#14B8A6",
  },
  "check-circle-2": {
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#22C55E",
  },
  flag: {
    path: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
    color: "#F97316",
  },
  "check-circle-3": {
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#EC4899",
  },
  pencil: {
    path: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    color: "#8B5CF6",
  },
} as const;

const Icon = memo(
  ({ type, className = "w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" }: IconProps) => {
    const iconData = iconMap[type as keyof typeof iconMap];
    if (!iconData) return null;

    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={iconData.path}
          stroke={iconData.color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
);

Icon.displayName = "Icon";

// Optimized reusable Card component with theme system
interface CardTheme {
  iconBg: string;
  borderColor: string;
  borderHover: string;
  shadowHover: string;
}

const cardThemes: Record<string, CardTheme> = {
  blue: {
    iconBg: "bg-blue-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#3B82F6]/80",
    shadowHover: "hover:shadow-blue-500/30",
  },
  purple: {
    iconBg: "bg-purple-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#A855F7]/80",
    shadowHover: "hover:shadow-purple-500/30",
  },
  green: {
    iconBg: "bg-green-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#22C55E]/80",
    shadowHover: "hover:shadow-green-500/30",
  },
  yellow: {
    iconBg: "bg-yellow-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#EAB308]/80",
    shadowHover: "hover:shadow-yellow-500/30",
  },
  cyan: {
    iconBg: "bg-cyan-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#06B6D4]/80",
    shadowHover: "hover:shadow-cyan-500/30",
  },
  red: {
    iconBg: "bg-red-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#EF4444]/80",
    shadowHover: "hover:shadow-red-500/30",
  },
  indigo: {
    iconBg: "bg-indigo-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#6366F1]/80",
    shadowHover: "hover:shadow-indigo-500/30",
  },
  teal: {
    iconBg: "bg-teal-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#14B8A6]/80",
    shadowHover: "hover:shadow-teal-500/30",
  },
  emerald: {
    iconBg: "bg-emerald-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#22C55E]/80",
    shadowHover: "hover:shadow-emerald-500/30",
  },
  orange: {
    iconBg: "bg-orange-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#F97316]/80",
    shadowHover: "hover:shadow-orange-500/30",
  },
  pink: {
    iconBg: "bg-pink-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#EC4899]/80",
    shadowHover: "hover:shadow-pink-500/30",
  },
  violet: {
    iconBg: "bg-violet-400/20",
    borderColor: "border-slate-700",
    borderHover: "hover:border-[#8B5CF6]/80",
    shadowHover: "hover:shadow-violet-500/30",
  },
};

interface HandbookCardComponentProps {
  card: HandbookCard;
}

const HandbookCardComponent = memo(function HandbookCardComponent({
  card,
}: HandbookCardComponentProps) {
  // Map the card's bgColor to theme
  const getThemeFromBgColor = (bgColor: string): keyof typeof cardThemes => {
    if (bgColor.includes("blue")) return "blue";
    if (bgColor.includes("purple")) return "purple";
    if (bgColor.includes("emerald")) return "green";
    if (bgColor.includes("yellow")) return "yellow";
    if (bgColor.includes("cyan")) return "cyan";
    if (bgColor.includes("red")) return "red";
    if (bgColor.includes("indigo")) return "indigo";
    if (bgColor.includes("teal")) return "teal";
    if (bgColor.includes("green")) return "emerald";
    if (bgColor.includes("orange")) return "orange";
    if (bgColor.includes("pink")) return "pink";
    if (bgColor.includes("violet")) return "violet";
    return "blue"; // default
  };

  const theme = getThemeFromBgColor(card.bgColor);
  const themeConfig = cardThemes[theme];

  return (
    <Link href={card.link}>
      <div
        className={`relative group bg-slate-800/50 backdrop-blur-2xl border ${themeConfig.borderColor} rounded-xl p-4 sm:p-6 lg:p-8 h-64 sm:h-72 lg:h-80 w-full max-w-md sm:max-w-lg lg:max-w-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:bg-slate-800/60 ${themeConfig.shadowHover} ${themeConfig.borderHover}`}
      >
        <div className="transition-all duration-300 group-hover:-translate-y-2 h-full flex flex-col">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 ${themeConfig.iconBg} rounded-lg flex items-center justify-center mb-3 sm:mb-4 lg:mb-5 aspect-square`}
          >
            <Icon type={card.iconType} />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4">
            {card.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-3 sm:mb-4">
            {card.description}
          </p>
          <button className="text-blue-400 font-medium hover:text-blue-300 transition-all duration-300 flex items-center text-sm hover:scale-110 transform origin-left mt-auto">
            Learn more
            <svg
              className="ml-1 w-4 h-4 transition-transform duration-300 hover:scale-125"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
});

// Custom hook for back to top functionality
const useBackToTop = () => {
  const handleScroll = useCallback(() => {
    const backToTopButton = document.getElementById("back-to-top");
    if (!backToTopButton) return;

    const isVisible = window.scrollY > 300;
    const action = isVisible ? "add" : "remove";
    const oppositeAction = isVisible ? "remove" : "add";

    backToTopButton.classList[action]("opacity-100", "translate-y-0");
    backToTopButton.classList[oppositeAction]("opacity-0", "translate-y-10");
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const backToTopButton = document.getElementById("back-to-top");
    if (!backToTopButton) return;

    window.addEventListener("scroll", handleScroll, { passive: true });
    backToTopButton.addEventListener("click", scrollToTop);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      backToTopButton.removeEventListener("click", scrollToTop);
    };
  }, [handleScroll, scrollToTop]);
};

// Optimized data particles component
const DataParticles = memo(function DataParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        delay: `${i}s`,
      })),
    []
  );

  return (
    <div className="absolute inset-0">
      {particles.map(({ id, delay }) => (
        <div
          key={id}
          className="data-particle"
          style={{ "--delay": delay } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

// Optimized page title component
const PageTitle = memo(function PageTitle() {
  return (
    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-shadow-lg px-4">
      <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
        Contribute
      </span>{" "}
      <span className="text-gradient animated-gradient bg-gradient-to-r from-cyan-400 via-emerald-500 to-blue-500">
        Handbook
      </span>
    </h1>
  );
});

export default function CommunityHandbook() {
  useBackToTop();

  const memoizedCards = useMemo(
    () =>
      handbookCards.map(card => (
        <HandbookCardComponent key={card.id} card={card} />
      )),
    []
  );

  return (
    <div className="bg-slate-900 text-white overflow-x-hidden dark">
      <Navigation />

      <main className="pt-24 relative overflow-hidden bg-slate-900 text-white">
        {/* Dark base background */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />

        {/* Starfield background */}
        <div className="absolute inset-0 overflow-hidden">
          <StarField density="high" showComets={true} cometCount={5} />
        </div>

        {/* Grid lines background */}
        <GridLines horizontalLines={21} verticalLines={18} />

        {/* Floating Data Particles */}
        <DataParticles />

        <div className="relative py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <PageTitle />
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {memoizedCards}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating back to top button */}
      <button
        id="back-to-top"
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 p-2 rounded-full bg-blue-600 text-white shadow-lg z-50 transition-all duration-300 opacity-0 translate-y-10"
        aria-label="Back to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  );
}
