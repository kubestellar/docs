"use client";

import Link from "next/link";
import { Link as LocalizedLink } from "@/i18n/navigation";
import type { useTranslations } from "next-intl";
import { getLocalizedUrl } from "@/lib/url";
import type { GithubStats } from "./useGithubStats";

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
                {/*DOCS */}
                <div className="relative mb-2">
                  <Link
                    href="/docs"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    <span>{t("docs")}</span>
                  </Link>
                </div>
                {/*NEWS */}
                <div className="relative mb-4">
                  <Link
                    href="/docs/news/latest-news"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    <span>{t("news")}</span>
                  </Link>
                </div>
                <div className="relative mb-4">
                  <a
                    href="https://console.kubestellar.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("liveDemo")}</span>
                  </a>
                </div>
                {/* MARKETPLACE */}
                <div className="relative mb-4">
                  <Link
                    href="/marketplace"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("marketplace")}</span>
                  </Link>
                </div>
                <div className="border-t border-gray-400/50 mb-4"></div>
                <div className="mb-2">
                  <span className="text-sm sm:text-base px-3 font-medium tracking-wider text-gray-400 uppercase">
                    {t("contribute")}
                  </span>
                </div>
                <div className="relative mb-2">
                  <a
                    href={getLocalizedUrl("https://kubestellar.io/joinus")}
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("joinIn")}</span>
                  </a>
                </div>
                <div className="relative mb-2">
                  <Link
                    href="/contribute-handbook"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("contributeHandbook")}</span>
                  </Link>
                </div>
                <div className="relative mb-2">
                  <Link
                    href="/quick-installation"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
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
                </div>
                <div className="relative mb-2">
                  <Link
                    href="/products"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
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
                </div>
                <div className="relative mb-2">
                  <LocalizedLink
                    href="/ladder"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("ladder")}</span>
                  </LocalizedLink>
                </div>
                <div className="relative mb-4">
                  <Link
                    href="/docs/contributing/security/security-inc"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("security")}</span>
                  </Link>
                </div>
                <div className="border-t border-gray-400/50 mb-4"></div>
                <div className="mb-2">
                  <span className="px-3 text-sm sm:text-base font-medium tracking-wider text-gray-400 uppercase">
                    {t("community")}
                  </span>
                </div>
                <div className="relative mb-2">
                  <Link
                    href="/contribute-handbook"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("getInvolved")}</span>
                  </Link>
                </div>
                <div className="relative mb-2">
                  <Link
                    href="/programs"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("programs")}</span>
                  </Link>
                </div>
                <div className="relative mb-2">
                  <LocalizedLink
                    href="/#contact"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    </div>
                    <span>{t("contactUs")}</span>
                  </LocalizedLink>
                </div>
                <div className="relative mb-4">
                  <LocalizedLink
                    href="/partners"
                    className="text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 mr-3"
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
                    <span>{t("partners")}</span>
                  </LocalizedLink>
                </div>
                <div className="border-t border-gray-400/50 mb-4"></div>
                <div className="mb-4">
                  <span className="text-sm sm:text-base px-3 font-medium tracking-wider text-gray-400 uppercase">
                    {t("github")}
                  </span>
                </div>

                {/* GitHub Stats */}
                <div className="mt-2 mb-4 px-3 space-y-2">
                  {/* Stars */}
                  <a
                    href="https://github.com/kubestellar/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg  max-w-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span className="text-sm font-medium text-gray-300">
                        {t("githubStar")}
                      </span>
                    </div>
                    <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                      {githubStats.stars}
                    </span>
                  </a>

                  {/* Forks */}
                  <a
                    href="https://github.com/kubestellar/console/fork"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg  max-w-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 mr-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        ></path>
                      </svg>
                      <span className="text-sm font-medium text-gray-300">
                        {t("githubFork")}
                      </span>
                    </div>
                    <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                      {githubStats.forks}
                    </span>
                  </a>

                  {/* Watchers */}
                  <a
                    href="https://github.com/kubestellar/console/stargazers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg  max-w-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 mr-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                      </svg>
                      <span className="text-sm font-medium text-gray-300">
                        {t("githubWatch")}
                      </span>
                    </div>
                    <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                      {githubStats.watchers}
                    </span>
                  </a>

                  {/* Create Issue */}
                  <a
                    href="https://github.com/kubestellar/docs/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg  max-w-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 mr-3 text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z" />
                        <path d="M8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-300">
                        {t("githubCreateIssue")}
                      </span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
  );
}
