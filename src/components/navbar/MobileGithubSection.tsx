"use client";

import type { useTranslations } from "next-intl";
import type { GithubStats } from "./useGithubStats";

interface MobileGithubSectionProps {
  t: ReturnType<typeof useTranslations>;
  githubStats: GithubStats;
}

/** Mobile menu's "GitHub" stats group (stars, forks, watchers, create issue). */
export default function MobileGithubSection({
  t,
  githubStats,
}: MobileGithubSectionProps) {
  return (
    <>
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
    </>
  );
}
