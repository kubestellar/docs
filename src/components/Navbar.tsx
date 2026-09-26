"use client";

import React from "react";
import { GridLines, StarField, LanguageSwitcher } from "./index";
import { useTranslations } from "next-intl";
import {
  useGithubStats,
  useNavDropdowns,
  NavbarLogo,
  ContributeDropdown,
  CommunityDropdown,
  GithubDropdown,
  MobileMenu,
} from "./navbar/index";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const githubStats = useGithubStats();
  const { isDropdownOpen, isContributeOpen, isCommunityOpen, isGithubOpen } =
    useNavDropdowns();

  const t = useTranslations("navigation");

  return (
    <>
      {/* Blur overlay when dropdown is open */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 transition-all duration-300"
          style={{ backdropFilter: "blur(8px)" }}
        />
      )}

      <nav className="fixed w-full z-50 bg-gradient-to-br from-green-900 via-purple-900 to-green-900/90 backdrop-blur-md border-b border-gray-700/50 transition-all duration-300">
        {/* Dark base background */}
        <div className="absolute inset-0 bg-[#0a0a0a]/90 z-[-3]"></div>

        {/* Starfield background */}
        <StarField
          density="low"
          showComets={true}
          cometCount={2}
          className="z-[-2]"
        />

        {/* Grid lines background */}
        <GridLines />

        <div className="max-w-7xl mx-auto px-0.5 sm:px-2 lg:px-1 relative">
          <div className="flex justify-between h-16 items-center">
            <NavbarLogo t={t}>
              <ContributeDropdown t={t} isContributeOpen={isContributeOpen} />
              <CommunityDropdown t={t} isCommunityOpen={isCommunityOpen} />
            </NavbarLogo>

            {/* Right side: Controls */}
            <div className="flex items-center sm:space-x-4">
              {/* Language Switcher */}
              <div className="language-switcher-container">
                <LanguageSwitcher className="relative group" />
              </div>

              <GithubDropdown
                t={t}
                isGithubOpen={isGithubOpen}
                githubStats={githubStats}
              />

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 rounded focus:outline-none bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700 group cursor-pointer"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <svg
                    className="w-6 h-6 stroke-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-90"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 stroke-white transition-all duration-300 group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <MobileMenu
            isMenuOpen={isMenuOpen}
            t={t}
            githubStats={githubStats}
          />
        </div>
      </nav>
    </>
  );
}
