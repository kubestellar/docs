"use client";

import Link from "next/link";
import type { useTranslations } from "next-intl";

interface MobileTopLinksProps {
  t: ReturnType<typeof useTranslations>;
}

/** Mobile menu's top-level links: Docs, News, Live Demo, Marketplace. */
export default function MobileTopLinks({ t }: MobileTopLinksProps) {
  return (
    <>
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
    </>
  );
}
