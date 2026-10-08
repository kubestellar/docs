"use client";

import Link from "next/link";
import { Link as LocalizedLink } from "@/i18n/navigation";
import type { useTranslations } from "next-intl";
import { getBaseUrl } from "@/lib/url";
import { getNavClasses } from "./styles";
import { LinkedinIcon } from "./icons";
import type { DropdownType } from "./types";

/** Marketing navbar variant: i18n copy + debounced pointer, driven by `useNavDropdowns`. */
interface MarketingCommunityDropdownProps {
  t: ReturnType<typeof useTranslations>;
  /** Derived by the parent from `openDropdown`; drives visibility AND aria-expanded. */
  isOpen: boolean;
  /** Pointer entered the dropdown; open it (closing any other). */
  onOpen: () => void;
  /** Pointer left the dropdown; schedule a debounced close. */
  onClose: () => void;
}

/** Docs navbar variant: theme-driven copy + raw pointer, driven by `openDropdown` state. */
interface DocsCommunityDropdownProps {
  isDark: boolean;
  openDropdown: DropdownType;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDropdownMouseEnter: () => void;
}

type CommunityDropdownProps =
  | MarketingCommunityDropdownProps
  | DocsCommunityDropdownProps;

/**
 * Desktop "Community" nav dropdown, unified across the marketing and docs
 * navbars (docs#7143). The two navbars still differ in copy source
 * (translations vs. static strings), pointer semantics (debounced vs. raw)
 * and link set, so this component branches on `isDark` — present only on the
 * docs variant's props — rather than forcing one behavior onto both call
 * sites.
 */
export default function CommunityDropdown(props: CommunityDropdownProps) {
  if ("isDark" in props) {
    return <DocsCommunityDropdown {...props} />;
  }
  return <MarketingCommunityDropdown {...props} />;
}

function MarketingCommunityDropdown({
  t,
  isOpen,
  onOpen,
  onClose,
}: MarketingCommunityDropdownProps) {
  return (
    <>
                {/* Community Dropdown */}
                <div
                  className="relative group after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-2 after:bg-transparent"
                  data-dropdown="community"
                  onMouseEnter={onOpen}
                  onMouseLeave={onClose}
                >
                  <button
                    type="button"
                    data-dropdown-button
                    className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-all duration-300 flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-100 transform nav-link-hover cursor-pointer"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
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
                    <span>{t("community")}</span>
                    <svg
                      className={`ml-1 h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
                    className="absolute left-0  mt-1 w-56 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl py-2 ring-1 ring-gray-700/50 transition-all duration-200 z-50 before:content-[''] before:absolute before:bottom-full before:left-0 before:right-0 before:h-2 before:bg-transparent"
                    data-dropdown-menu
                    hidden={!isOpen}
                  >
                    <Link
                      href="/contribute-handbook"
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
                      {t("getInvolved")}
                    </Link><Link
                      href="/docs/news/latest-news"
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
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        ></path>
                      </svg>
                      {t("news")}
                    </Link><Link
                      href="/docs/news/reviews"
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
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        ></path>
                      </svg>
                      {t("reviews")}
                    </Link><Link
                      href="/docs/community/meetings#agendas-and-notes"
                      target="_blank"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-cyan-900/30 rounded transition-all duration-200 hover:text-cyan-300 hover:shadow-md"
                    >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                      {t("agenda")}
                      <svg
                      className="ml-1 w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    </Link>
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        ></path>
                      </svg>
                      {t("programs")}
                    </Link>
                    <LocalizedLink
                      href="/#contact"
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
                      {t("contactUs")}
                    </LocalizedLink>
                    <LocalizedLink
                      href="/partners"
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
                      {t("partners")}
                    </LocalizedLink>
                  </div>
                </div>
    </>
  );
}

function DocsCommunityDropdown({
  isDark,
  openDropdown,
  onMouseEnter,
  onMouseLeave,
  onDropdownMouseEnter,
}: DocsCommunityDropdownProps) {
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
