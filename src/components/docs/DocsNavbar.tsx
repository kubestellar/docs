"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
// import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { VERSIONS } from '@/config/versions'
import { VersionSelector } from './VersionSelector';
import {
  useGithubStats,
  useDocsSearch,
  ContributeDropdown,
  CommunityDropdown,
  GithubDropdown,
  SearchCommandPalette,
  MobileMenu,
} from "./navbar";
import type { DropdownType } from "./navbar";

export default function DocsNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const githubStats = useGithubStats();
  const search = useDocsSearch(() => setOpenDropdown(null));

  // const searchParams = useSearchParams()
  // const pathname = usePathname()
  // const router = useRouter()
  // Note: Version label is now handled by VersionSelector component
  void VERSIONS; // Keep import for reference

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (dropdown: DropdownType) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const isDark = resolvedTheme === 'dark';

  if (!mounted) {
    return null;
  }

  return (
    <div className="nextra-nav-container sticky top-0 z-30 w-full bg-transparent">
      <div className={`nextra-nav-container-blur pointer-events-none absolute z-[-1] h-full w-full shadow-sm border-b ${
        isDark 
          ? 'bg-[#111] border-neutral-800' 
          : 'bg-white border-gray-200'
      }`} />
      
      <div className="mx-auto flex items-center gap-2 h-16 px-4 max-w-[90rem]">
        <Link href="/" className="cursor-pointer">
              <div className="flex-shrink-0 cursor-pointer relative z-10">
                <Image
                  src="/KubeStellar-with-Logo-transparent.png"
                  alt="Kubestellar logo"
                  width={160}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              </div>
            </Link>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-1.5">
          <a
            href="https://console.kubestellar.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors px-2 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer relative hidden xl:flex"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="ml-2">Live Demo</span>
          </a>

          <Link
            href="/marketplace"
            className="text-sm transition-colors px-2 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer relative hidden xl:flex"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <span className="ml-2">Marketplace</span>
          </Link>

          <ContributeDropdown
            isDark={isDark}
            openDropdown={openDropdown}
            onMouseEnter={() => handleMouseEnter("contribute")}
            onMouseLeave={handleMouseLeave}
            onDropdownMouseEnter={handleDropdownMouseEnter}
          />

          <CommunityDropdown
            isDark={isDark}
            openDropdown={openDropdown}
            onMouseEnter={() => handleMouseEnter("community")}
            onMouseLeave={handleMouseLeave}
            onDropdownMouseEnter={handleDropdownMouseEnter}
          />

          <div className="relative hidden xl:flex w-px h-5 bg-gray-300 dark:bg-neutral-700 mx-1" />

          {/* Version selector dropdown */}
          <VersionSelector />

          <GithubDropdown
            isDark={isDark}
            openDropdown={openDropdown}
            githubStats={githubStats}
            onMouseEnter={() => handleMouseEnter("github")}
            onMouseLeave={handleMouseLeave}
            onDropdownMouseEnter={handleDropdownMouseEnter}
          />
        </div>

        <button onClick={search.openSearch}
          className={`hidden md:flex w-80 text-sm transition-colors px-3 py-1.5 rounded-md items-center gap-2 ml-2 cursor-pointer ${
            isDark 
              ? 'text-gray-300 hover:text-gray-100 hover:bg-neutral-800 border border-neutral-800'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
          }`}
          aria-label="Search documentation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs">Search docs...</span>
          <kbd className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
            isDark ? 'bg-neutral-800 text-gray-300' : 'bg-gray-100 text-gray-500'
          }`}>
            ⌘K
          </kbd>
        </button>

        <button
          onClick={search.openSearch}
          className={`md:hidden p-1.5 rounded-md transition-colors cursor-pointer ${
            isDark 
              ? 'text-gray-300 hover:text-gray-100 hover:bg-neutral-800'
              : 'text-gray-300 hover:text-gray-100 hover:bg-gray-100'
          }`}
          aria-label="Search documentation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>


        <button
          className={`xl:hidden p-1.5 rounded-md transition-colors cursor-pointer ${
            isDark 
              ? 'text-gray-300 hover:text-gray-100 hover:bg-neutral-800'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Toggle menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      <SearchCommandPalette
        isDark={isDark}
        isSearchOpen={search.isSearchOpen}
        searchQuery={search.searchQuery}
        isSearching={search.isSearching}
        searchResults={search.searchResults}
        selectedIndex={search.selectedIndex}
        searchInputRef={search.searchInputRef}
        commandPaletteRef={search.commandPaletteRef}
        onQueryChange={search.performSearch}
        onClose={search.closeSearch}
        onSelectIndex={search.setSelectedIndex}
        onResultClick={search.trackSearchResultClick}
      />

      <MobileMenu isDark={isDark} isMenuOpen={isMenuOpen} githubStats={githubStats} />
    </div>
  );
}
