"use client";

import {
  GridLines,
  StarField,
  ContributionCallToAction,
  Navbar,
  Footer,
  PageActions,
} from "../../../components/index";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function MaintainerLadderPage() {
  const t = useTranslations("ladderPage");
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

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
      <PageActions position="fixed" />

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
        <section className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Mobile Layout */}
            <div className="lg:hidden space-y-6">
              {levels.map((level, index) => (
                <div
                  key={level.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredLevel(level.id)}
                  onMouseLeave={() => setHoveredLevel(null)}
                >
                  {/* Glowing border effect */}
                  <div
                    className={`absolute -inset-[2px] bg-gradient-to-r ${level.gradient} rounded-xl opacity-0 group-hover:opacity-70 blur-sm transition-opacity duration-500`}
                  ></div>

                  <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-xl p-5 border border-white/5 overflow-hidden">
                    {/* Animated background particles */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div
                        className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${level.gradient} rounded-full blur-3xl opacity-20`}
                      ></div>
                      <div
                        className={`absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl ${level.gradient} rounded-full blur-3xl opacity-20`}
                      ></div>
                    </div>

                    {/* Level badge */}
                    <div className="absolute -top-3 -right-3">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${level.gradient} rounded-full flex items-center justify-center shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <span className="text-white font-bold text-sm">
                          {level.id}
                        </span>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${level.gradient} rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform duration-300`}
                      >
                        <div className="text-white scale-90">{level.icon}</div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                          {level.title}
                        </h3>
                        {level.timeframe && (
                          <div className="inline-block bg-blue-500/20 rounded-full px-2 py-0.5 text-xs text-blue-300 mb-2">
                            {level.timeframe}
                          </div>
                        )}
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {level.description}
                        </p>

                        {/* Compact requirements */}
                        <div className="space-y-1">
                          {level.requirements.slice(0, 2).map((req, reqIndex) => (
                            <div key={reqIndex} className="flex items-start gap-2">
                              <div
                                className={`w-1 h-1 rounded-full bg-gradient-to-r ${level.gradient} mt-1.5 flex-shrink-0`}
                              ></div>
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {req}
                              </p>
                            </div>
                          ))}
                          {level.requirements.length > 2 && (
                            <p className="text-xs text-gray-500 italic">
                              +{level.requirements.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Next level indicator */}
                    {index < levels.length - 1 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Next:</span>
                          <span
                            className={`text-xs font-semibold bg-gradient-to-r ${level.gradient} bg-clip-text text-transparent`}
                          >
                            {level.nextLevel}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block">
              {/* Central Ladder Line with pulse effect */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 transform -translate-x-1/2 z-5">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-purple-400 to-red-400 animate-pulse opacity-50"></div>
              </div>

              {levels.map((level, index) => (
                <div
                  key={level.id}
                  className="relative z-20 mb-8"
                  onMouseEnter={() => setHoveredLevel(level.id)}
                  onMouseLeave={() => setHoveredLevel(null)}
                >
                  <div
                    className={`flex items-center ${
                      index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    {/* Content Side */}
                    <div
                      className={`w-5/12 ${
                        index % 2 === 0 ? "pr-12" : "pl-12"
                      }`}
                    >
                      <div className="relative group">
                        {/* Glowing border */}
                        <div
                          className={`absolute -inset-[2px] bg-gradient-to-r ${level.gradient} rounded-xl opacity-0 group-hover:opacity-70 blur transition-opacity duration-500`}
                        ></div>

                        <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-xl p-6 border border-white/5 overflow-hidden">
                          {/* Animated corner accents */}
                          <div
                            className={`absolute top-0 ${
                              index % 2 === 0 ? "right-0" : "left-0"
                            } w-24 h-24 bg-gradient-to-br ${level.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700`}
                          ></div>

                          <div className="relative">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`w-10 h-10 bg-gradient-to-br ${level.gradient} rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300`}
                              >
                                <div className="text-white scale-90">
                                  {level.icon}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                                  {level.title}
                                </h3>
                                {level.timeframe && (
                                  <div className="inline-block bg-blue-500/20 rounded-full px-2 py-0.5 text-xs text-blue-300 mt-1">
                                    {level.timeframe}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                              {level.description}
                            </p>

                            {/* Requirements */}
                            <div className="space-y-2 mb-4">
                              {level.requirements.map((req, reqIndex) => (
                                <div
                                  key={reqIndex}
                                  className="flex items-start gap-2 group/item"
                                >
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${level.gradient} mt-1.5 flex-shrink-0 group-hover/item:scale-150 transition-transform duration-200`}
                                  ></div>
                                  <p className="text-xs text-gray-400 leading-relaxed">
                                    {req}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Good Standing */}
                            {level.goodStanding && (
                              <div className="p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-xs text-gray-300 leading-relaxed">
                                  {level.goodStanding}
                                </p>
                              </div>
                            )}

                            {/* Next Level */}
                            {index < levels.length - 1 && (
                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-gray-500">Next Level:</span>
                                <span
                                  className={`text-sm font-semibold bg-gradient-to-r ${level.gradient} bg-clip-text text-transparent`}
                                >
                                  {level.nextLevel}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center Circle */}
                    <div className="w-2/12 flex justify-center">
                      <div
                        className={`relative w-16 h-16 bg-gradient-to-br ${level.gradient} rounded-full flex items-center justify-center shadow-2xl z-30 transition-all duration-300 ${
                          hoveredLevel === level.id ? "scale-125" : "scale-100"
                        }`}
                      >
                        <span className="text-white font-bold text-xl">
                          {level.id}
                        </span>
                        {/* Ripple effect */}
                        {hoveredLevel === level.id && (
                          <div
                            className={`absolute inset-0 rounded-full bg-gradient-to-br ${level.gradient} animate-ping opacity-75`}
                          ></div>
                        )}
                      </div>
                    </div>

                    {/* Empty Side */}
                    <div className="w-5/12"></div>
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
