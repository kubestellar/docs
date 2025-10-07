"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import StarField from "./StarField";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && isMenuOpen) {
        setIsMenuOpen(false);
      }
      if (mobile && activeDropdown) {
        setActiveDropdown(null);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen, activeDropdown]);

  // Handle click outside to close dropdowns and mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dropdown for both desktop and mobile
  const toggleDropdown = (dropdownId: string) => {
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setActiveDropdown(null);
  };

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle desktop hover for dropdowns (only on non-touch devices)
  useEffect(() => {
    if (isMobile) return;

    const initDesktopDropdowns = () => {
      const dropdownContainers = document.querySelectorAll<HTMLElement>("[data-dropdown]");

      dropdownContainers.forEach(container => {
        const dropdownId = container.getAttribute('data-dropdown');
        
        const handleMouseEnter = () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setActiveDropdown(dropdownId);
        };

        const handleMouseLeave = () => {
          timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
          }, 150);
        };

        container.addEventListener("mouseenter", handleMouseEnter);
        container.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          container.removeEventListener("mouseenter", handleMouseEnter);
          container.removeEventListener("mouseleave", handleMouseLeave);
        };
      });
    };

    initDesktopDropdowns();
  }, [isMobile]);

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

      for (let i = 0; i < 10; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", "0");
        line.setAttribute("y1", `${i * 10}%`);
        line.setAttribute("x2", "100%");
        line.setAttribute("y2", `${i * 10}%`);
        line.setAttribute("stroke", "#6366F1");
        line.setAttribute("stroke-width", "0.5");
        line.setAttribute("stroke-opacity", "0.3");
        gridSvg.appendChild(line);
      }

      for (let i = 0; i < 10; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", `${i * 10}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("x2", `${i * 10}%`);
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", "#6366F1");
        line.setAttribute("stroke-width", "0.5");
        line.setAttribute("stroke-opacity", "0.3");
        gridSvg.appendChild(line);
      }

      container.appendChild(gridSvg);
    };

    const gridContainer = document.getElementById("grid-lines-nav");
    if (gridContainer) createGrid(gridContainer);
  }, []);

  return (
    <nav ref={navRef} className="fixed w-full z-50 bg-gradient-to-br from-green-900 via-purple-900 to-green-900/90 backdrop-blur-md border-b border-gray-700/50 transition-all duration-300">
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
      <div
        id="grid-lines-nav"
        className="absolute inset-0 opacity-10 z-[-1]"
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Left side: Logo */}
          <Link href="/" className="cursor-pointer">
            <div className="flex-shrink-0 cursor-pointer relative z-10">
              <Image
                src="/KubeStellar-with-Logo-transparent.png"
                alt="Kubestellar logo"
                width={160}
                height={40}
                className="h-8 w-auto sm:h-10 lg:h-12 transition-all duration-300"
              />
            </div>
          </Link>

          {/* Center: Nav Links */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center space-x-4 xl:space-x-8">
              {/* Docs Link */}
              <div className="relative group">
                <a
                  href="#docs"
                  className="text-sm xl:text-base font-medium text-gray-300 hover:text-blue-400 transition-all duration-300 flex items-center space-x-1 px-2 xl:px-3 py-2 rounded-lg hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 nav-link-hover"
                >
                  <div className="relative">
                    <svg
                      className="w-5 h-5 transition-all duration-300 group-hover:scale-102"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </div>
                  <span>Docs</span>
                </a>
              </div>

              {/* Blog Link */}
              <div className="relative group">
                <a
                  href="https://kubestellar.medium.com/list/predefined:e785a0675051:READING_LIST"
                  className="text-sm xl:text-base font-medium text-gray-300 hover:text-purple-400 transition-all duration-300 flex items-center space-x-1 px-2 xl:px-3 py-2 rounded-lg hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20 transform nav-link-hover"
                >
                  <div className="relative">
                    <svg
                      className="w-5 h-5 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 8a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      ></path>
                    </svg>
                  </div>
                  <span>Blog</span>
                </a>
              </div>

              {/* Contribute Dropdown */}
              <div className="relative group" data-dropdown="contribute">
                <button
                  type="button"
                  onClick={() => !isMobile && toggleDropdown('contribute')}
                  className="text-sm xl:text-base font-medium text-gray-300 hover:text-emerald-400 transition-all duration-300 flex items-center space-x-1 px-2 xl:px-3 py-2 rounded-lg hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-100 transform nav-link-hover"
                  data-dropdown-button
                  aria-haspopup="true"
                  aria-expanded={activeDropdown === 'contribute'}
                >
                  <div className="relative">
                    <svg
                      className="w-5 h-5 transition-all duration-300 group-hover:scale-102"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      ></path>
                    </svg>
                  </div>
                  <span>Contribute</span>
                  <svg
                    className="ml-1 h-4 w-4 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`absolute left-0 mt-2 w-56 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl py-2 ring-1 ring-gray-700/50 transition-all duration-200 z-50 transform origin-top-left ${
                    activeDropdown === 'contribute' ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                  }`}
                  data-dropdown-menu
                >
                  <a
                    href="#join-in"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      ></path>
                    </svg>
                    Join In
                  </a>
                  <a
                    href="/community-handbook"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      ></path>
                    </svg>
                    Contribute Handbook
                  </a>
                  <a
                    href="#security"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      ></path>
                    </svg>
                    Security
                  </a>
                </div>
              </div>

              {/* Community Dropdown */}
              <div className="relative group" data-dropdown="community">
                <button
                  type="button"
                  onClick={() => !isMobile && toggleDropdown('community')}
                  className="text-sm xl:text-base font-medium text-gray-300 hover:text-cyan-400 transition-all duration-300 flex items-center space-x-1 px-2 xl:px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-100 transform nav-link-hover"
                  data-dropdown-button
                  aria-haspopup="true"
                  aria-expanded={activeDropdown === 'community'}
                >
                  <div className="relative">
                    <svg
                      className="w-5 h-5 transition-all duration-300 group-hover:scale-102"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                  </div>
                  <span>Community</span>
                  <svg
                    className="ml-1 h-4 w-4 transition-transform duration-300 "
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`absolute left-0 mt-2 w-56 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl py-2 ring-1 ring-gray-700/50 transition-all duration-200 z-50 transform origin-top-left ${
                    activeDropdown === 'community' ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                  }`}
                  data-dropdown-menu
                >
                  <a
                    href="#get-involved"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-cyan-900/30 rounded transition-all duration-200 hover:text-cyan-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      ></path>
                    </svg>
                    Get Involved
                  </a>
                  <Link
                    href="/programs"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-cyan-900/30 rounded transition-all duration-200 hover:text-cyan-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10"
                      ></path>
                    </svg>
                    Programs
                  </Link>
                  <a
                    href="#ladder"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-cyan-900/30 rounded transition-all duration-200 hover:text-cyan-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      ></path>
                    </svg>
                    Ladder
                  </a>
                  <a
                    href="#contact-us"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-cyan-900/30 rounded transition-all duration-200 hover:text-cyan-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                    Contact Us
                  </a>
                  <a
                    href="#partners"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-cyan-900/30 rounded transition-all duration-200 hover:text-cyan-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                    Partners
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Controls */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Version Dropdown */}
            <div className="relative group hidden md:block" data-dropdown="version">
              <button
                onClick={() => toggleDropdown('version')}
                data-dropdown-button
                className="text-sm font-medium text-gray-300 hover:text-indigo-400 transition-all duration-300 flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-lg hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-100 transform nav-link-hover"
              >
                3.8.1
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                data-dropdown-menu
                className={`absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-700 transition-all duration-200 transform origin-top-right ${
                  activeDropdown === 'version' ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                }`}
              >
                <a
                  href="#"
                  className="block px-5 py-2 text-sm text-gray-300 hover:bg-blue-900/30 rounded transition-all duration-200 hover:text-blue-300 hover:shadow-md"
                >
                  3.8.1 (Current)
                </a>
                <a
                  href="#"
                  className="block px-5 py-2 text-sm text-gray-300 hover:bg-blue-900/30 rounded transition-all duration-200 hover:text-blue-300 hover:shadow-md"
                >
                  3.8.0
                </a>
                <a
                  href="#"
                  className="block px-5 py-2 text-sm text-gray-300 hover:bg-blue-900/30 rounded transition-all duration-200 hover:text-blue-300 hover:shadow-md"
                >
                  All versions
                </a>
              </div>
            </div>

            {/* Language Dropdown */}
            <div className="relative group hidden lg:block" data-dropdown="language">
              <button
                onClick={() => toggleDropdown('language')}
                data-dropdown-button
                className="text-sm font-medium text-gray-300 hover:text-pink-400 transition-all duration-300 flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-lg hover:bg-pink-500/10 hover:shadow-lg hover:shadow-pink-500/20 hover:scale-100 transform nav-link-hover"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
                English
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                data-dropdown-menu
                className={`absolute right-0 mt-2 w-32 bg-gray-800/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-700 transition-all duration-200 transform origin-top-right ${
                  activeDropdown === 'language' ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                }`}
              >
                <a
                  href="#"
                  className="block px-5 py-2 text-sm text-gray-300 hover:bg-purple-900/30 rounded transition-all duration-200 hover:text-purple-300 hover:shadow-md"
                >
                  English
                </a>
                <a
                  href="#"
                  className="block px-5 py-2 text-sm text-gray-300 hover:bg-purple-900/30 rounded transition-all duration-200 hover:text-purple-300 hover:shadow-md"
                >
                  日本語
                </a>
                <a
                  href="#"
                  className="block px-5 py-2 text-sm text-gray-300 hover:bg-purple-900/30 rounded transition-all duration-200 hover:text-purple-300 hover:shadow-md"
                >
                  简体中文
                </a>
              </div>
            </div>

            {/* GitHub Dropdown */}
            <div className="relative group hidden sm:block" data-dropdown="github">
              <button
                onClick={() => toggleDropdown('github')}
                data-dropdown-button
                className="text-sm font-medium text-gray-300 hover:text-green-400 transition-all duration-300 flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-lg hover:bg-green-500/10 hover:shadow-lg hover:shadow-green-500/20 hover:scale-100 transform nav-link-hover"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                data-dropdown-menu
                className={`absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-700 transition-all duration-200 transform origin-top-right ${
                  activeDropdown === 'github' ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                }`}
              >
                <a
                  href="https://github.com/kubestellar/kubestellar"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10 2C5.58 2 2 5.58 2 10c0 3.87 2.69 7.13 6.39 7.93.47.09.64-.2.64-.45 0-.22-.01-.94-.01-1.7-2.6.57-3.15-1.25-3.15-1.25-.43-1.09-1.05-1.38-1.05-1.38-.86-.59.07-.58.07-.58.95.07 1.45.98 1.45.98.85 1.45 2.23 1.03 2.78.79.09-.62.33-1.03.6-1.27-2.22-.25-4.555-1.11-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Star
                  <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                    12.3k
                  </span>
                </a>
                <a
                  href="https://github.com/kubestellar/kubestellar/fork"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a3 3 0 106 0 3 3 0 00-6 0zm0 2a2 2 0 114 0 2 2 0 01-4 0zm10 10a3 3 0 11-6 0 3 3 0 016 0zm-2-2a2 2 0 100 4 2 2 0 000-4zm-6 2a2 2 0 100-4 2 2 0 000 4zm8-2a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  Fork
                  <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                    2.1k
                  </span>
                </a>
                <a
                  href="https://github.com/kubestellar/kubestellar/watchers"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2C5.454 2 1.73 5.11.458 9.09a1.5 1.5 0 000 1.82C1.73 14.89 5.454 18 10 18s8.27-3.11 9.542-7.09a1.5 1.5 0 000-1.82C18.27 5.11 14.546 2 10 2zm0 14c-3.866 0-7.09-2.61-8.13-6C2.91 6.61 6.134 4 10 4s7.09 2.61 8.13 6c-1.04 3.39-4.264 6-8.13 6zm0-8a2 2 0 110 4 2 2 0 010-4z" />
                  </svg>
                  Watch
                  <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                    350
                  </span>
                </a>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg focus:outline-none hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={toggleMobileMenu}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center relative">
                <span
                  className={`block h-0.5 w-6 bg-current transition-all duration-300 absolute ${
                    isMenuOpen ? 'rotate-45' : '-translate-y-1.5'
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-current transition-all duration-300 absolute ${
                    isMenuOpen ? '-rotate-45' : 'translate-y-1.5'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden absolute top-full left-0 w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 transition-all duration-300 overflow-hidden ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Mobile Docs Link */}
            <a
              href="#docs"
              className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Docs
            </a>

            {/* Mobile Blog Link */}
            <a
              href="https://kubestellar.medium.com/list/predefined:e785a0675051:READING_LIST"
              className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Blog
            </a>

            {/* Mobile Contribute Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown('mobile-contribute')}
                className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Contribute
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeDropdown === 'mobile-contribute' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  activeDropdown === 'mobile-contribute' ? 'max-h-48' : 'max-h-0'
                }`}
              >
                <div className="pl-12 space-y-1">
                  <a href="#join-in" className="block px-4 py-2 text-sm text-gray-400 hover:text-emerald-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Join In</a>
                  <Link href="/community-handbook" className="block px-4 py-2 text-sm text-gray-400 hover:text-emerald-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Contribute Handbook</Link>
                  <a href="#security" className="block px-4 py-2 text-sm text-gray-400 hover:text-emerald-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Security</a>
                </div>
              </div>
            </div>

            {/* Mobile Community Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown('mobile-community')}
                className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Community
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeDropdown === 'mobile-community' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  activeDropdown === 'mobile-community' ? 'max-h-64' : 'max-h-0'
                }`}
              >
                <div className="pl-12 space-y-1">
                  <a href="#get-involved" className="block px-4 py-2 text-sm text-gray-400 hover:text-cyan-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Get Involved</a>
                  <Link href="/programs" className="block px-4 py-2 text-sm text-gray-400 hover:text-cyan-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Programs</Link>
                  <a href="#ladder" className="block px-4 py-2 text-sm text-gray-400 hover:text-cyan-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Ladder</a>
                  <a href="#contact-us" className="block px-4 py-2 text-sm text-gray-400 hover:text-cyan-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Contact Us</a>
                  <a href="#partners" className="block px-4 py-2 text-sm text-gray-400 hover:text-cyan-300 transition-colors" onClick={() => setIsMenuOpen(false)}>Partners</a>
                </div>
              </div>
            </div>

            {/* Mobile Version/Language/GitHub combined section */}
            <div className="border-t border-gray-700/50 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <a href="#" className="flex items-center justify-center px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                  Version 3.8.1
                </a>
                <a href="https://github.com/kubestellar/kubestellar" className="flex items-center justify-center px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}