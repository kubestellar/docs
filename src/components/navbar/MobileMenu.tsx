"use client";

import type { useTranslations } from "next-intl";
import type { GithubStats } from "./useGithubStats";
import MobileTopLinks from "./MobileTopLinks";
import MobileContributeSection from "./MobileContributeSection";
import MobileCommunitySection from "./MobileCommunitySection";
import MobileGithubSection from "./MobileGithubSection";

interface MobileMenuProps {
  isMenuOpen: boolean;
  t: ReturnType<typeof useTranslations>;
  githubStats: GithubStats;
}

/**
 * Collapsible mobile nav panel shown below the nav bar when the
 * mobile menu button is toggled open. Mirrors the desktop dropdowns'
 * links for small screens.
 */
export default function MobileMenu({
  isMenuOpen,
  t,
  githubStats,
}: MobileMenuProps) {
  if (!isMenuOpen) return null;

  return (
    <div className="lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <MobileTopLinks t={t} />
        <div className="border-t border-gray-400/50 mb-4"></div>
        <MobileContributeSection t={t} />
        <div className="border-t border-gray-400/50 mb-4"></div>
        <MobileCommunitySection t={t} />
        <div className="border-t border-gray-400/50 mb-4"></div>
        <MobileGithubSection t={t} githubStats={githubStats} />
      </div>
    </div>
  );
}
