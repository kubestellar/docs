"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Shared hero markup for the `/coming-soon` and `/coming-soon-marketplace`
 * pages, which were otherwise byte-for-byte identical. Both pages share the
 * `comingSoonPage` translation namespace; `children` lets the marketplace
 * variant slot its demo-video section in between the hero and `ComingSoonCTA`
 * without duplicating the hero markup.
 */
export default function ComingSoonHero({ children }: { children?: ReactNode }) {
  const t = useTranslations("comingSoonPage");

  return (
    <>
      {/* Hero Section */}
      <section className="px-4 py-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            {t("statusBadge")}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-gradient">{t("title")}</span>
            <span className="block text-gradient-animated">
              {t("titleSpan")}
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-16">
            {t("description")}
          </p>
        </div>
      </section>

      {children}
    </>
  );
}
