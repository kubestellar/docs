"use client";

import {
  GridLines,
  StarField,
  ContributionCallToAction,
  Navbar,
  Footer,
} from "../../../components/index";
import { useTranslations } from "next-intl";

export default function MaintainerLadderPage() {
  const t = useTranslations("ladderPage");

  const levels = [
    {
      id: 1,
      title: t("levels.contributor.title"),
      nextLevel: t("levels.contributor.nextLevel"),
      description: t("levels.contributor.description"),
      requirements: [
        t("levels.contributor.requirements.0"),
        t("levels.contributor.requirements.1"),
        t("levels.contributor.requirements.2"),
        t("levels.contributor.requirements.3"),
      ],
      goodStanding: t("levels.contributor.goodStanding"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: 2,
      title: t("levels.unpaidMentee.title"),
      nextLevel: t("levels.unpaidMentee.nextLevel"),
      description: t("levels.unpaidMentee.description"),
      requirements: [
        t("levels.unpaidMentee.requirements.0"),
        t("levels.unpaidMentee.requirements.1"),
        t("levels.unpaidMentee.requirements.2"),
        t("levels.unpaidMentee.requirements.3"),
        t("levels.unpaidMentee.requirements.4"),
      ],
      goodStanding: t("levels.unpaidMentee.goodStanding"),
      timeframe: t("levels.unpaidMentee.timeframe"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      gradient: "from-purple-500 to-purple-600",
    },
    {
      id: 3,
      title: t("levels.paidMentee.title"),
      nextLevel: t("levels.paidMentee.nextLevel"),
      description: t("levels.paidMentee.description"),
      requirements: [
        t("levels.paidMentee.requirements.0"),
        t("levels.paidMentee.requirements.1"),
        t("levels.paidMentee.requirements.2"),
        t("levels.paidMentee.requirements.3"),
        t("levels.paidMentee.requirements.4"),
      ],
      goodStanding: t("levels.paidMentee.goodStanding"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      gradient: "from-green-500 to-green-600",
    },
    {
      id: 4,
      title: t("levels.mentor.title"),
      nextLevel: t("levels.mentor.nextLevel"),
      description: t("levels.mentor.description"),
      requirements: [
        t("levels.mentor.requirements.0"),
        t("levels.mentor.requirements.1"),
        t("levels.mentor.requirements.2"),
        t("levels.mentor.requirements.3"),
      ],
      goodStanding: t("levels.mentor.goodStanding"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      gradient: "from-orange-500 to-orange-600",
    },
    {
      id: 5,
      title: t("levels.maintainer.title"),
      nextLevel: t("levels.maintainer.nextLevel"),
      description: t("levels.maintainer.description"),
      requirements: [
        t("levels.maintainer.requirements.0"),
        t("levels.maintainer.requirements.1"),
        t("levels.maintainer.requirements.2"),
        t("levels.maintainer.requirements.3"),
      ],
      goodStanding: t("levels.maintainer.goodStanding"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      gradient: "from-red-500 to-red-600",
    },
    {
      id: 6,
      title: t("levels.ambassador.title"),
      nextLevel: t("levels.ambassador.nextLevel"),
      description: t("levels.ambassador.description"),
      requirements: [
        t("levels.ambassador.requirements.0"),
        t("levels.ambassador.requirements.1"),
        t("levels.ambassador.requirements.2"),
        t("levels.ambassador.requirements.3"),
        t("levels.ambassador.requirements.4"),
      ],
      goodStanding: t("levels.ambassador.goodStanding"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      ),
      gradient: "from-cyan-500 to-cyan-600",
    },
  ];

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen">
      <Navbar />

      {/* Full page background with starfield */}
      <div className="fixed inset-0 z-0">
        {/* Dark base background */}
        <div className="absolute inset-0 bg-[#0a0a0a]"></div>

        {/* Starfield background */}
        <StarField density="medium" showComets={true} cometCount={3} />

        {/* Grid lines background */}
        <GridLines horizontalLines={21} verticalLines={18} />
      </div>

      <div className="relative z-10 pt-7">
        {" "}
        {/* Add padding-top to account for fixed navbar */}
        {/* Header Section */}
        <section className="pt-12 pb-12 sm:pt-28 sm:pb-16 lg:pt-24 lg:pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
                {t("title")}{" "}
                <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
                  {t("titleSpan")}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {t("subtitle")}
              </p>

              {/* Tracking Sheet CTA */}
              <div className="mt-8 flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                  <a
                    href="http://kubestellar.io/ladder_stats"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center gap-3 px-8 py-4 bg-gray-900 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group-hover:scale-105"
                  >
                    <div className="text-left">
                      <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        How do we audit our contributor ladder?
                      </div>
                      <div className="text-lg font-semibold text-white flex items-center gap-2">
                        View Real-Time Statistics
                        <span className="text-blue-400 group-hover:translate-x-1 transition-transform inline-block">
                          →
                        </span>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Ladder Section */}
        <section className="py-4 sm:py-5 md:py-6 lg:py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Mobile Layout */}
            <div className="lg:hidden space-y-2">
              {levels.map((level, index) => (
                <div key={level.id} className="relative">
                  {/* Level Card - Ultra Compact */}
                  <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-2.5 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-md">
                    {/* Header with Icon and Title */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${level.gradient} rounded-lg flex items-center justify-center shadow-md`}>
                        <div className="text-white scale-75">{level.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 bg-gradient-to-br ${level.gradient} rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                            {level.id}
                          </div>
                          <h3 className="text-sm font-bold text-white truncate leading-tight">
                            {level.title}
                          </h3>
                        </div>
                        {level.timeframe && (
                          <span className="inline-block bg-blue-900/50 rounded-full px-1.5 py-0.5 text-[10px] text-blue-200 mt-0.5">
                            {level.timeframe}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description - Compact */}
                    <p className="text-gray-300 text-xs mb-2 line-clamp-2 leading-tight">
                      {level.description}
                    </p>

                    {/* Requirements - Collapsible */}
                    <details className="group mb-1">
                      <summary className="cursor-pointer text-xs font-semibold text-white mb-1 flex items-center justify-between hover:text-blue-400 transition-colors py-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                          {t("requirementsLabel")}
                        </span>
                        <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <ul className="space-y-1 mt-1 pl-2">
                        {level.requirements.map((req, reqIndex) => (
                          <li key={reqIndex} className="text-[11px] text-gray-300 flex items-start leading-tight">
                            <span className="text-green-400 mr-1.5 flex-shrink-0 text-xs">✓</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </details>

                    {/* Good Standing - Collapsible */}
                    {level.goodStanding && (
                      <details className="group mb-1">
                        <summary className="cursor-pointer text-xs font-semibold text-blue-300 flex items-center justify-between hover:text-blue-400 transition-colors py-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                            {t("goodStandingLabel")}
                          </span>
                          <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="mt-1 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                          <p className="text-[11px] text-gray-300 leading-tight">
                            {level.goodStanding}
                          </p>
                        </div>
                      </details>
                    )}

                    {/* Next Level Indicator */}
                    {index < levels.length - 1 && (
                      <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">{t("nextLevelLabel")}</span>
                        <span className="text-blue-400 font-semibold">{level.nextLevel}</span>
                      </div>
                    )}
                  </div>

                  {/* Connector Line */}
                  {index < levels.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className={`w-0.5 h-4 bg-gradient-to-b ${level.gradient} opacity-50`}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Layout - Compact Zigzag */}
            <div className="hidden lg:block space-y-3">
              {/* Central Ladder Line with Animation */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500 transform -translate-x-1/2 z-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500 animate-pulse"></div>
              </div>

              {levels.map((level, index) => (
                <div key={level.id} className="relative z-10 mb-3">
                  <div className={`flex items-center gap-4 ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                    {/* Content Card - Super Compact */}
                    <div className="w-[46%]">
                      <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-3 border border-white/10 transition-all duration-300 hover:bg-gray-800/60 hover:border-white/30 hover:shadow-xl hover:scale-[1.01] group">
                        {/* Header */}
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className={`w-9 h-9 bg-gradient-to-br ${level.gradient} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform flex-shrink-0`}>
                            <div className="text-white scale-75">{level.icon}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white leading-tight truncate">
                              {level.title}
                            </h3>
                            {level.timeframe && (
                              <span className="inline-block bg-blue-900/50 rounded-full px-2 py-0.5 text-[10px] text-blue-200 mt-0.5">
                                {level.timeframe}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 text-xs mb-2.5 leading-relaxed line-clamp-2">
                          {level.description}
                        </p>

                        {/* Requirements - Compact Grid */}
                        <div className="mb-2.5">
                          <h4 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                            {t("requirementsLabel")}
                          </h4>
                          <ul className="space-y-1 pl-3">
                            {level.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="text-[11px] text-gray-300 flex items-start leading-tight">
                                <span className="text-green-400 mr-1.5 flex-shrink-0">✓</span>
                                <span className="leading-snug">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Good Standing - Compact */}
                        {level.goodStanding && (
                          <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded mb-2">
                            <h4 className="text-[10px] font-semibold text-blue-300 mb-1 flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                              {t("goodStandingLabel")}
                            </h4>
                            <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">
                              {level.goodStanding}
                            </p>
                          </div>
                        )}

                        {/* Next Level */}
                        {index < levels.length - 1 && (
                          <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">{t("nextLevelLabel")}</span>
                            <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                              {level.nextLevel}
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center Circle - Compact */}
                    <div className="w-[8%] flex justify-center">
                      <div className={`relative w-12 h-12 bg-gradient-to-br ${level.gradient} rounded-full flex items-center justify-center shadow-xl z-20 transition-all duration-300 hover:scale-110 hover:rotate-6 group cursor-pointer`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-white font-bold text-base relative z-10">
                          {level.id}
                        </span>
                        {/* Pulse effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${level.gradient} rounded-full animate-ping opacity-20`}></div>
                      </div>
                    </div>

                    {/* Empty Side */}
                    <div className="w-[46%]"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Ready To Contribute Section */}
        <ContributionCallToAction />
      </div>
      <Footer />
    </div>
  );
}
