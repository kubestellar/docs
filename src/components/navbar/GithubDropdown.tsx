"use client";

import type { useTranslations } from "next-intl";
import type { GithubStats } from "./useGithubStats";

interface GithubDropdownProps {
  t: ReturnType<typeof useTranslations>;
  /** Derived by the parent from `openDropdown`; drives visibility AND aria-expanded. */
  isOpen: boolean;
  /** Pointer entered the dropdown; open it (closing any other). */
  onOpen: () => void;
  /** Pointer left the dropdown; schedule a debounced close. */
  onClose: () => void;
  githubStats: GithubStats;
}

/** Desktop GitHub stats dropdown (stars, forks, watchers, create issue). */
export default function GithubDropdown({
  t,
  isOpen,
  onOpen,
  onClose,
  githubStats,
}: GithubDropdownProps) {
  return (
    <>
              {/* GitHub Dropdown */}
              <div
                className="hidden lg:flex relative group"
                data-dropdown="github"
                onMouseEnter={onOpen}
                onMouseLeave={onClose}
              >
                <div
                  data-dropdown-button
                  className="hidden lg:flex text-sm font-medium text-gray-300 hover:text-green-400 transition-all duration-300 items-center space-x-1 px-3 py-2 rounded-lg hover:bg-green-500/10 hover:shadow-lg hover:shadow-green-500/20 hover:scale-100 transform nav-link-hover"
                >
                  <a
                    href="https://github.com/kubestellar/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
                </div>
                <div
                  className="absolute right-0 mt-1 w-48 bg-gray-800/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-700 before:content-[''] before:absolute before:bottom-full before:left-0 before:right-0 before:h-2 before:bg-transparent"
                  data-dropdown-menu
                  hidden={!isOpen}
                >
                  <a
                    href="https://github.com/kubestellar/console"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    {t("githubStar")}
                    <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                      {githubStats.stars}
                    </span>
                  </a>
                  <a
                    href="https://github.com/kubestellar/console/fork"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
                    </svg>

                    {t("githubFork")}
                    <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                      {githubStats.forks}
                    </span>
                  </a>
                  <a
                    href="https://github.com/kubestellar/console/stargazers"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2C5.454 2 1.73 5.11.458 9.09a1.5 1.5 0 000 1.82C1.73 14.89 5.454 18 10 18s8.27-3.11 9.542-7.09a1.5 1.5 0 000-1.82C18.27 5.11 14.546 2 10 2zm0 14c-3.866 0-7.09-2.61-8.13-6C2.91 6.61 6.134 4 10 4s7.09 2.61 8.13 6c-1.04 3.39-4.264 6-8.13 6zm0-8a2 2 0 110 4 2 2 0 010-4z" />
                    </svg>
                    {t("githubWatch")}
                    <span className="ml-auto bg-gray-700 text-gray-300 text-xs rounded px-2 py-0.5">
                      {githubStats.watchers}
                    </span>
                  </a>
                  <a
                    href="https://github.com/kubestellar/docs/issues"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-emerald-900/30 rounded transition-all duration-200 hover:text-emerald-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z" />
                      <path d="M8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                    </svg>
                    {t("githubCreateIssue")}
                  </a>
                </div>
              </div>
    </>
  );
}
