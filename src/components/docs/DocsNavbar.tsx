"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

type DropdownType = "contribute" | "community" | "version" | "language" | "github" | null;

export default function DocsNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMatches, setSearchMatches] = useState<number>(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [githubStats, setGithubStats] = useState({
    stars: "0",
    forks: "0",
    watchers: "0",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchGithubStats = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/kubestellar/kubestellar"
        );
        if (!response.ok) {
          throw new Error("Network response was not okay");
        }
        const data = await response.json();
        const formatNumber = (num: number): string => {
          if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
          }
          return num.toString();
        };
        setGithubStats({
          stars: formatNumber(data.stargazers_count),
          forks: formatNumber(data.forks_count),
          watchers: formatNumber(data.subscribers_count),
        });
      } catch (err) {
        console.error("Failed to fetch Github stats: ", err);
      }
    };
    fetchGithubStats();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSearchOpen) {
          clearSearch();
          setIsSearchOpen(false);
        } else {
          setOpenDropdown(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

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

  const clearSearch = () => {
    const highlights = document.querySelectorAll('.search-highlight, .search-highlight-current');
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });
    setSearchQuery("");
    setSearchMatches(0);
    setCurrentMatchIndex(0);
  };

  const highlightText = (text: string, query: string): Node[] => {
    if (!query) return [document.createTextNode(text)];
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part) => {
      if (regex.test(part)) {
        const span = document.createElement('span');
        span.className = 'search-highlight';
        span.textContent = part;
        span.style.backgroundColor = isDark ? '#fbbf24' : '#fef08a';
        span.style.color = '#000';
        span.style.padding = '2px 0';
        span.style.borderRadius = '2px';
        return span;
      }
      return document.createTextNode(part);
    });
  };

  const performSearch = (query: string) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    clearSearch();
    setSearchQuery(query);

    const mainContent = document.querySelector('main') || document.body;
    const walker = document.createTreeWalker(
      mainContent,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains('search-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent && node.textContent.toLowerCase().includes(query.toLowerCase())) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes: Node[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    let matchCount = 0;
    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode;
      if (!parent || !textNode.textContent) return;

      const text = textNode.textContent;
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        matchCount += matches.length;
        const fragment = document.createDocumentFragment();
        const nodes = highlightText(text, query);
        nodes.forEach(n => fragment.appendChild(n));
        parent.replaceChild(fragment, textNode);
      }
    });

    setSearchMatches(matchCount);
    if (matchCount > 0) {
      setCurrentMatchIndex(1);
      highlightCurrentMatch(0);
    }
  };

  const highlightCurrentMatch = (index: number) => {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach((highlight, i) => {
      if (i === index) {
        highlight.classList.add('search-highlight-current');
        (highlight as HTMLElement).style.backgroundColor = isDark ? '#f97316' : '#fb923c';
        (highlight as HTMLElement).style.fontWeight = 'bold';
        highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        highlight.classList.remove('search-highlight-current');
        (highlight as HTMLElement).style.backgroundColor = isDark ? '#fbbf24' : '#fef08a';
        (highlight as HTMLElement).style.fontWeight = 'normal';
      }
    });
  };

  const navigateToNextMatch = () => {
    if (searchMatches === 0) return;
    const nextIndex = currentMatchIndex >= searchMatches ? 1 : currentMatchIndex + 1;
    setCurrentMatchIndex(nextIndex);
    highlightCurrentMatch(nextIndex - 1);
  };

  const navigateToPrevMatch = () => {
    if (searchMatches === 0) return;
    const prevIndex = currentMatchIndex <= 1 ? searchMatches : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    highlightCurrentMatch(prevIndex - 1);
  };

  if (!mounted) {
    return null;
  }
  
  const buttonClasses = `text-sm transition-colors px-2 py-1.5 rounded-md flex items-center gap-1.5 ${
    isDark 
      ? 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }`;
  
  const dropdownClasses = `absolute left-0 mt-1 w-52 rounded-md shadow-xl py-1 border z-50 ${
    isDark 
      ? 'bg-neutral-900 border-neutral-800'
      : 'bg-white border-gray-200'
  }`;
  
  const dropdownItemClasses = `flex items-center px-3 py-2 text-sm transition-colors ${
    isDark
      ? 'text-gray-300 hover:bg-neutral-800'
      : 'text-gray-700 hover:bg-gray-100'
  }`;

  return (
    <div className="nextra-nav-container sticky top-0 z-20 w-full bg-transparent">
      <div className={`nextra-nav-container-blur pointer-events-none absolute z-[-1] h-full w-full shadow-sm border-b ${
        isDark 
          ? 'bg-[#111] border-neutral-800' 
          : 'bg-white border-gray-200'
      }`} />
      
      <div className="mx-auto flex items-center gap-2 h-16 px-4 max-w-[90rem]">
        <Link href="/" className="flex items-center hover:opacity-75 transition-opacity">
          <Image
            src="/KubeStellar-with-Logo-transparent.png"
            alt="KubeStellar"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="flex-1" />

        <div className={`hidden md:flex items-center gap-2 mr-4 transition-all ${
          isSearchOpen ? 'w-96' : 'w-auto'
        }`}>
          {!isSearchOpen ? (
            <button
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className={`text-sm transition-colors px-3 py-1.5 rounded-md flex items-center gap-2 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800 border border-neutral-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
              aria-label="Search page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs">Search...</span>
              <kbd className={`text-xs px-1.5 py-0.5 rounded ${
                isDark ? 'bg-neutral-800 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                Ctrl+F
              </kbd>
            </button>
          ) : (
            <div className={`flex items-center gap-2 w-full border rounded-md px-3 py-1.5 ${
              isDark 
                ? 'bg-neutral-900 border-neutral-700'
                : 'bg-white border-gray-300'
            }`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => performSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      navigateToPrevMatch();
                    } else {
                      navigateToNextMatch();
                    }
                  }
                }}
                placeholder="Search page..."
                className={`flex-1 bg-transparent outline-none text-sm ${
                  isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              {searchMatches > 0 && (
                <>
                  <span className={`text-xs whitespace-nowrap ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {currentMatchIndex}/{searchMatches}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={navigateToPrevMatch}
                      className={`p-1 rounded transition-colors ${
                        isDark 
                          ? 'hover:bg-neutral-800 text-gray-400 hover:text-gray-200'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      aria-label="Previous match"
                      title="Previous (Shift+Enter)"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={navigateToNextMatch}
                      className={`p-1 rounded transition-colors ${
                        isDark 
                          ? 'hover:bg-neutral-800 text-gray-400 hover:text-gray-200'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      aria-label="Next match"
                      title="Next (Enter)"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
              <button
                onClick={() => {
                  clearSearch();
                  setIsSearchOpen(false);
                }}
                className={`p-1 rounded transition-colors ${
                  isDark 
                    ? 'hover:bg-neutral-800 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Close search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1">
          
          <div 
            className="relative" 
            onMouseEnter={() => handleMouseEnter("contribute")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={buttonClasses}
              aria-haspopup="true"
              aria-expanded={openDropdown === "contribute"}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Contribute</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdown === "contribute" && (
              <div
                className={dropdownClasses}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
              <a
                href="/#join-in"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join In
              </a>
              <a
                href="/community-handbook"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Contribute Handbook
              </a>
              <a
                href="/#security"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security
              </a>
              </div>
            )}
          </div>

          <div 
            className="relative"
            onMouseEnter={() => handleMouseEnter("community")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={buttonClasses}
              aria-haspopup="true"
              aria-expanded={openDropdown === "community"}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Community</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdown === "community" && (
              <div
                className={dropdownClasses}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
              <a
                href="/#get-involved"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Get Involved
              </a>
              <Link
                href="/programs"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10" />
                </svg>
                Programs
              </Link>
              <a
                href="/#ladder"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Ladder
              </a>
              <a
                href="/#contact-us"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </a>
              <a
                href="/#partners"
                className={dropdownItemClasses}
              >
                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Partners
              </a>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-300 dark:bg-neutral-700 mx-1" />

          <div 
            className="relative"
            onMouseEnter={() => handleMouseEnter("version")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`text-xs font-mono transition-colors px-2 py-1.5 rounded-md flex items-center gap-1.5 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-haspopup="true"
              aria-expanded={openDropdown === "version"}
            >
              <span>v3.8.1</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdown === "version" && (
              <div
                className={`absolute right-0 mt-1 w-44 rounded-md shadow-xl py-1 border z-50 ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-white border-gray-200'
                }`}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
              <a href="#" className={`block px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-gray-300 hover:bg-neutral-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                v3.8.1 <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>(Current)</span>
              </a>
              <a href="#" className={`block px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-gray-300 hover:bg-neutral-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                v3.8.0
              </a>
              <hr className={isDark ? 'my-1 border-neutral-800' : 'my-1 border-gray-200'} />
              <a href="#" className={`block px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-gray-300 hover:bg-neutral-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                All versions →
              </a>
              </div>
            )}
          </div>

          <div 
            className="relative"
            onMouseEnter={() => handleMouseEnter("language")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`text-sm transition-colors p-1.5 rounded-md flex items-center ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Change language"
              aria-haspopup="true"
              aria-expanded={openDropdown === "language"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </button>
            {openDropdown === "language" && (
              <div
                className={`absolute right-0 mt-1 w-32 rounded-md shadow-xl py-1 border z-50 ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-white border-gray-200'
                }`}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
              <a href="#" className={`block px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-gray-300 hover:bg-neutral-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                English
              </a>
              <a href="#" className={`block px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-gray-300 hover:bg-neutral-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                日本語
              </a>
              <a href="#" className={`block px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-gray-300 hover:bg-neutral-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                简体中文
              </a>
              </div>
            )}
          </div>

          <div 
            className="relative"
            onMouseEnter={() => handleMouseEnter("github")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`text-sm transition-colors p-1.5 rounded-md flex items-center ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="GitHub"
              aria-haspopup="true"
              aria-expanded={openDropdown === "github"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
            {openDropdown === "github" && (
              <div
                className={`absolute right-0 mt-1 w-44 rounded-md shadow-xl py-1 border z-50 ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-white border-gray-200'
                }`}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
              <a
                href="https://github.com/kubestellar/kubestellar"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isDark
                    ? 'text-gray-300 hover:bg-neutral-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                  </svg>
                  Star
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-neutral-800' : 'bg-gray-200'
                }`}>
                  {githubStats.stars}
                </span>
              </a>
              <a
                href="https://github.com/kubestellar/kubestellar/fork"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isDark
                    ? 'text-gray-300 hover:bg-neutral-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                  </svg>
                  Fork
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-neutral-800' : 'bg-gray-200'
                }`}>
                  {githubStats.forks}
                </span>
              </a>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}
          className={`md:hidden p-1.5 rounded-md transition-colors ${
            isDark 
              ? 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Search page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <button
          className={`md:hidden p-1.5 rounded-md transition-colors ${
            isDark 
              ? 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Toggle menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {isSearchOpen && (
        <div className={`md:hidden border-t ${
          isDark ? 'border-neutral-800 bg-[#111]' : 'border-gray-200 bg-white'
        }`}>
          <div className="px-4 py-3">
            <div className={`flex items-center gap-2 w-full border rounded-md px-3 py-2 ${
              isDark 
                ? 'bg-neutral-900 border-neutral-700'
                : 'bg-white border-gray-300'
            }`}>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => performSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      navigateToPrevMatch();
                    } else {
                      navigateToNextMatch();
                    }
                  }
                }}
                placeholder="Search page..."
                className={`flex-1 bg-transparent outline-none text-sm ${
                  isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                onClick={() => {
                  clearSearch();
                  setIsSearchOpen(false);
                }}
                className={`p-1 rounded transition-colors flex-shrink-0 ${
                  isDark 
                    ? 'hover:bg-neutral-800 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Close search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {searchMatches > 0 && (
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {currentMatchIndex} of {searchMatches} matches
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={navigateToPrevMatch}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      isDark 
                        ? 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={navigateToNextMatch}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      isDark 
                        ? 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className={`md:hidden border-t ${
          isDark ? 'border-neutral-800 bg-[#111]' : 'border-gray-200 bg-white'
        }`}>
          <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className={`text-xs font-semibold uppercase px-2 py-1.5 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>Contribute</div>
            <a href="/#join-in" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Join In
            </a>
            <a href="/community-handbook" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Contribute Handbook
            </a>
            <a href="/#security" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Security
            </a>
            
            <div className={`text-xs font-semibold uppercase px-2 py-1.5 mt-3 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>Community</div>
            <a href="/#get-involved" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Get Involved
            </a>
            <a href="/programs" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Programs
            </a>
            <a href="/#ladder" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Ladder
            </a>
            <a href="/#contact-us" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Contact Us
            </a>
            <a href="/#partners" className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-neutral-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Partners
            </a>

            <div className={`pt-3 border-t mt-3 ${
              isDark ? 'border-neutral-800' : 'border-gray-200'
            }`}>
              <a
                href="https://github.com/kubestellar/kubestellar"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isDark
                    ? 'text-gray-300 hover:bg-neutral-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
                <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                  isDark ? 'bg-neutral-800' : 'bg-gray-200'
                }`}>
                  {githubStats.stars} ★
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
