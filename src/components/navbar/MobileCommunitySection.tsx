"use client";

import Link from "next/link";
import { Link as LocalizedLink } from "@/i18n/navigation";
import type { useTranslations } from "next-intl";

interface MobileCommunitySectionProps {
  t: ReturnType<typeof useTranslations>;
}

/** Mobile menu's "Community" link group. */
export default function MobileCommunitySection({
  t,
}: MobileCommunitySectionProps) {
  return (
    <>
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
    </>
  );
}
