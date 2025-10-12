"use client";

import { useEffect, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { StarField, GridLines } from "@/components";
import { handbookCards, HandbookCard } from "./handbook";

interface HandbookCardComponentProps {
  card: HandbookCard;
}

const HandbookCardComponent = memo(function HandbookCardComponent({ card }: HandbookCardComponentProps) {
  const cardClasses = useMemo(() => 
    `relative group bg-slate-800/50 border border-slate-700 rounded-xl p-8 h-72 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/30`,
    []
  );

  const iconClasses = useMemo(() => 
    `w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center mb-4`,
    [card.bgColor]
  );

  const svgClasses = useMemo(() => 
    `w-6 h-6 ${card.iconColor}`,
    [card.iconColor]
  );

  return (
    <Link href={card.link}>
      <div className={cardClasses}>
        <div className="transition-all duration-300 group-hover:-translate-y-2 h-full flex flex-col">
          <div className={iconClasses}>
            <svg
              className={svgClasses}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={card.iconPath}
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
          <p className="text-gray-300 leading-relaxed flex-grow mb-4">
            {card.description}
          </p>
          <div className="mt-auto">
            <span className="learn-more-enhanced">Learn More</span>
          </div>
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
    const action = isVisible ? 'add' : 'remove';
    const oppositeAction = isVisible ? 'remove' : 'add';
    
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
const DataParticles = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      delay: `${i}s`
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
const PageTitle = memo(() => (
  <h1 className="text-6xl font-bold text-center mb-16 text-shadow-lg">
    <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
      Contribute
    </span>{" "}
    <span className="text-gradient animated-gradient bg-gradient-to-r from-cyan-400 via-emerald-500 to-blue-500">
      Handbook
    </span>
  </h1>
));

export default function CommunityHandbook() {
  useBackToTop();
  
  const memoizedCards = useMemo(() => 
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

        <div className="relative py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <PageTitle />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {memoizedCards}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating back to top button */}
      <button
        id="back-to-top"
        className="fixed bottom-8 right-8 p-2 rounded-full bg-blue-600 text-white shadow-lg z-50 transition-all duration-300 opacity-0 translate-y-10"
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
