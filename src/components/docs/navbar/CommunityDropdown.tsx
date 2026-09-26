"use client";

import Link from "next/link";
import { getBaseUrl } from "@/lib/url";
import type { DropdownType } from "./types";
import { getNavClasses } from "./styles";
import { LinkedinIcon } from "./icons";

interface CommunityDropdownProps {
  isDark: boolean;
  openDropdown: DropdownType;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDropdownMouseEnter: () => void;
}

/** Desktop "Community" nav dropdown for the docs navbar. */
export default function CommunityDropdown({
  isDark,
  openDropdown,
  onMouseEnter,
  onMouseLeave,
  onDropdownMouseEnter,
}: CommunityDropdownProps) {
  const { buttonClasses, dropdownClasses, dropdownItemClasses } = getNavClasses(isDark);
  const isOpen = openDropdown === "community";

  return (
    <div
      className="relative hidden xl:flex"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className={`${buttonClasses} cursor-pointer`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onMouseEnter={onDropdownMouseEnter}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Community</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className={dropdownClasses}
          onMouseEnter={onDropdownMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <Link href="/contribute-handbook" className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Get Involved
          </Link>
          <Link href="/programs" className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Programs
          </Link>
          <Link href="/docs/news/latest-news" className={dropdownItemClasses}>
            <svg
              className="w-5 h-5 mr-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M28.075 18.121v7.896c0 0.552-0.312 0.999-0.998 0.999-0.166 0-0.577-0.354-1.082-0.887v-21.194c0.505-0.533 0.916-0.887 1.082-0.887 0.748 0 0.998 0.447 0.998 0.998v8.096c1.353 0.038 2.613 1.135 2.613 2.489 0 1.355-1.26 2.452-2.613 2.49zM12.015 20.046c0.062 0 0-9.029 0-9.029 6.857 0 10.922-3.010 13.064-5.074v19.177c-2.142-2.063-6.207-5.074-13.064-5.074zM8.021 27.952l-1.997-7.927h-1.998c0 0-0.594-1.348-0.864-2.996-0.509 0-0.954 0-1.134 0-0.551 0-0.998-0.447-0.998-0.999v-0.998c0-0.552 0.447-0.999 0.998-0.999 0.18 0 0.625 0 1.134 0 0.271-1.648 0.864-2.995 0.864-2.995h6.99v8.987h-1.997l0.252 0.998h0.997l0.499 1.998h-0.994l1.243 4.931h-2.995z">
              </path>
            </svg>
            News and Reviews
          </Link>
          <a href={`${getBaseUrl()}/en#contact`} className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Us
          </a>
          <a href="https://kubestellar.io/linkedin" className={dropdownItemClasses}>
            <LinkedinIcon className="w-5 h-5 mr-2.5" />
            LinkedIn
          </a>
          <a href={`${getBaseUrl()}/en/partners`} className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Partners
          </a>
        </div>
      )}
    </div>
  );
}
