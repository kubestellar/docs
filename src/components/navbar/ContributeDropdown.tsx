"use client";

import Link from "next/link";
import { Link as LocalizedLink } from "@/i18n/navigation";
import type { useTranslations } from "next-intl";
import { getLocalizedUrl, getBaseUrl } from "@/lib/url";
import { getNavClasses } from "./styles";
import type { DropdownType } from "./types";

/** Marketing navbar variant: i18n copy + debounced pointer, driven by `useNavDropdowns`. */
interface MarketingContributeDropdownProps {
  t: ReturnType<typeof useTranslations>;
  /** Derived by the parent from `openDropdown`; drives visibility AND aria-expanded. */
  isOpen: boolean;
  /** Pointer entered the dropdown; open it (closing any other). */
  onOpen: () => void;
  /** Pointer left the dropdown; schedule a debounced close. */
  onClose: () => void;
}

/** Docs navbar variant: theme-driven copy + raw pointer, driven by `openDropdown` state. */
interface DocsContributeDropdownProps {
  isDark: boolean;
  openDropdown: DropdownType;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDropdownMouseEnter: () => void;
}

type ContributeDropdownProps =
  | MarketingContributeDropdownProps
  | DocsContributeDropdownProps;

/**
 * Desktop "Contribute" nav dropdown, unified across the marketing and docs
 * navbars (docs#7144). See CommunityDropdown.tsx for why this branches on
 * `isDark` — present only on the docs variant's props — instead of forcing
 * one behavior onto both call sites.
 */
export default function ContributeDropdown(props: ContributeDropdownProps) {
  if ("isDark" in props) {
    return <DocsContributeDropdown {...props} />;
  }
  return <MarketingContributeDropdown {...props} />;
}

function MarketingContributeDropdown({
  t,
  isOpen,
  onOpen,
  onClose,
}: MarketingContributeDropdownProps) {
  return (
    <>
                {/* Contribute Dropdown */}
                <div
                  className="relative group after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-2 after:bg-transparent"
                  data-dropdown="contribute"
                  onMouseEnter={onOpen}
                  onMouseLeave={onClose}
                >
                  <button
                    type="button"
                    data-dropdown-button
                    className="text-sm font-medium text-gray-300 hover:text-emerald-400 transition-all duration-300 flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-100 transform nav-link-hover cursor-pointer"
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
                    <span>{t("contribute")}</span>
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
                    className="absolute left-0 mt-1 w-56 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl py-2 ring-1 ring-gray-700/50 transition-all duration-200 z-50 before:content-[''] before:absolute before:bottom-full before:left-0 before:right-0 before:h-2 before:bg-transparent"
                    data-dropdown-menu
                    hidden={!isOpen}
                  >
                    <a
                      href={getLocalizedUrl("https://kubestellar.io/joinus")}
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
                      {t("joinIn")}
                    </a>
                    <Link
                      href="/contribute-handbook"
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
                      {t("contributeHandbook")}
                    </Link>
                    <Link
                      href="/quick-installation"
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                      {t("quickInstallation")}
                    </Link>
                    <Link
                      href="/products"
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
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10"
                        ></path>
                      </svg>
                      {t("products")}
                    </Link>
                    <LocalizedLink
                      href="/ladder"
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
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        ></path>
                      </svg>
                      {t("ladder")}
                    </LocalizedLink>
                    <Link
                      href="/docs/contributing/security/security-inc"
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
                      {t("security")}
                    </Link>
                  </div>
                </div>
    </>
  );
}

function DocsContributeDropdown({
  isDark,
  openDropdown,
  onMouseEnter,
  onMouseLeave,
  onDropdownMouseEnter,
}: DocsContributeDropdownProps) {
  const { buttonClasses, dropdownClasses, dropdownItemClasses } = getNavClasses(isDark);
  const isOpen = openDropdown === "contribute";

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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <span>Contribute</span>
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
          <a href={getLocalizedUrl("https://kubestellar.io/joinus")} className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Join In
          </a>
          <Link href="/contribute-handbook" className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Contributor Handbook
          </Link>
          <Link href="/quick-installation" className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Quick Installation</span>
          </Link>
          <Link href="/products" className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Products</span>
          </Link>
          <a href={`${getBaseUrl()}/en/ladder`} className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Ladder</span>
          </a>
          <Link href="/docs/contributing/security/security-inc" className={dropdownItemClasses}>
            <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security
          </Link>
        </div>
      )}
    </div>
  );
}
