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
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [activeLevel, setActiveLevel] = useState(1);

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

  const handleMarkComplete = (levelId: number) => {
    if (!completedLevels.includes(levelId)) {
      setCompletedLevels([...completedLevels, levelId]);
      if (levelId < levels.length) {
        setActiveLevel(levelId + 1);
      }
    }
  };

  const isLevelUnlocked = (levelId: number) => {
    return levelId === 1 || completedLevels.includes(levelId - 1);
  };

  const isLevelCompleted = (levelId: number) => {
    return completedLevels.includes(levelId);
  };

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen">
      <Navbar />
      <PageActions position="fixed" />

      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#0a0a0a]"></div>
        <StarField density="medium" showComets={true} cometCount={3} />
        <GridLines horizontalLines={21} verticalLines={18} />
      </div>

      <div className="relative z-10 pt-7">
        {/* Compact Header */}
        <section className="pt-16 pb-8 sm:pt-20 sm:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                {t("title")}{" "}
                <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
                  {t("titleSpan")}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                {t("subtitle")}
              </p>

              {/* Compact Progress */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-xs text-gray-400">Progress:</span>
                <span className="text-base font-bold text-blue-400">
                  {completedLevels.length} / {levels.length}
                </span>
                <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{
                      width: `${(completedLevels.length / levels.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Compact CTA */}
              <div className="mt-6">
                <a
                  href="http://kubestellar.io/ladder_stats"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all text-sm"
                >
                  <span className="text-gray-300">
                    View Real-Time Statistics
                  </span>
                  <span className="text-blue-400">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Compact Ladder Section */}
        <section className="py-6 sm:py-8 md:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Mobile Layout */}
            <div className="lg:hidden">
              {levels.map((level, index) => {
                const isUnlocked = isLevelUnlocked(level.id);
                const isCompleted = isLevelCompleted(level.id);
                const isActive = activeLevel === level.id;

                return (
                  <div key={level.id} className="mb-3">
                    <div
                      className={`bg-gray-800/40 backdrop-blur-md rounded-lg p-4 border relative transition-all duration-500 ${
                        isUnlocked
                          ? isActive
                            ? "border-blue-500/50 shadow-lg shadow-blue-500/20"
                            : "border-white/10"
                          : "border-gray-700/30 opacity-50"
                      } ${isCompleted ? "border-green-500/50" : ""}`}
                    >
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 text-gray-500 mx-auto mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <p className="text-gray-400 text-xs">
                              Complete previous level
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isCompleted ? "bg-green-500" : `bg-gradient-to-br ${level.gradient}`}`}
                        >
                          {isCompleted ? (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {level.id}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="text-center mb-3">
                          <div
                            className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br ${level.gradient} rounded-full mb-2 text-lg`}
                          >
                            {level.icon}
                          </div>
                          <h3 className="text-base font-bold text-white mb-1">
                            {level.title}
                          </h3>
                          {level.timeframe && (
                            <div className="inline-block bg-blue-900/50 rounded-full px-2 py-0.5 text-xs text-blue-200 mb-1">
                              {level.timeframe}
                            </div>
                          )}
                          <p className="text-gray-300 text-xs mb-2">
                            {level.description}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-semibold text-white">
                            {t("requirementsLabel")}
                          </h4>
                          <ul className="space-y-0.5">
                            {level.requirements.map((req, reqIndex) => (
                              <li
                                key={reqIndex}
                                className="text-xs text-gray-300 flex items-start"
                              >
                                <span className="text-green-400 mr-1.5">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {level.goodStanding && (
                          <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <h4 className="text-xs font-semibold text-blue-300 mb-1">
                              {t("goodStandingLabel")}
                            </h4>
                            <p className="text-xs text-gray-300">
                              {level.goodStanding}
                            </p>
                          </div>
                        )}

                        {isUnlocked && !isCompleted && (
                          <button
                            onClick={() => handleMarkComplete(level.id)}
                            className="mt-2 w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-1.5 px-3 rounded-lg transition-all text-xs flex items-center justify-center gap-1"
                          >
                            Mark as Complete
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                        )}

                        {index < levels.length - 1 && (
                          <div className="text-center mt-2 pt-2 border-t border-gray-700/30">
                            <div className="text-xs text-gray-400">
                              Next:{" "}
                              <span className="font-semibold text-blue-400">
                                {level.nextLevel}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {index < levels.length - 1 && (
                      <div className="flex justify-center my-1">
                        <div
                          className={`w-0.5 h-4 ${isCompleted ? "bg-gradient-to-b from-green-500 to-green-400" : "bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"}`}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block">
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-700/30 transform -translate-x-1/2 z-5"></div>
              <div
                className="absolute left-1/2 top-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500 transform -translate-x-1/2 z-5 transition-all duration-1000"
                style={{
                  height: `${(completedLevels.length / levels.length) * 100}%`,
                }}
              ></div>

              {levels.map((level, index) => {
                const isUnlocked = isLevelUnlocked(level.id);
                const isCompleted = isLevelCompleted(level.id);
                const isActive = activeLevel === level.id;

                return (
                  <div key={level.id} className="relative z-20 mb-10">
                    <div
                      className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`w-5/12 ${index % 2 === 0 ? "pr-8" : "pl-8"}`}
                      >
                        <div
                          className={`bg-gray-800/40 backdrop-blur-md rounded-lg p-5 border relative transition-all duration-500 ${
                            isUnlocked
                              ? isActive
                                ? "border-blue-500/50 shadow-lg shadow-blue-500/20 scale-105"
                                : "border-white/10 hover:bg-gray-800/50 hover:border-white/20 hover:scale-105"
                              : "border-gray-700/30 opacity-50"
                          } ${isCompleted ? "border-green-500/50" : ""}`}
                        >
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
                              <div className="text-center">
                                <svg
                                  className="w-12 h-12 text-gray-500 mx-auto mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                  />
                                </svg>
                                <p className="text-gray-400 text-sm">
                                  Complete previous level
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center mb-3">
                            <div
                              className={`w-10 h-10 bg-gradient-to-br ${level.gradient} rounded-full flex items-center justify-center mr-3 text-lg`}
                            >
                              {level.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {level.title}
                              </h3>
                              {level.timeframe && (
                                <div className="inline-block bg-blue-900/50 rounded-full px-2 py-0.5 text-xs text-blue-200">
                                  {level.timeframe}
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-300 mb-3 text-sm">
                            {level.description}
                          </p>

                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-white">
                              {t("requirementsLabel")}
                            </h4>
                            <ul className="space-y-1">
                              {level.requirements.map((req, reqIndex) => (
                                <li
                                  key={reqIndex}
                                  className="text-gray-300 flex items-start text-sm"
                                >
                                  <span className="text-green-400 mr-2">•</span>
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {level.goodStanding && (
                            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                              <h4 className="text-sm font-semibold text-blue-300 mb-1">
                                {t("goodStandingLabel")}
                              </h4>
                              <p className="text-xs text-gray-300">
                                {level.goodStanding}
                              </p>
                            </div>
                          )}

                          {isUnlocked && !isCompleted && (
                            <button
                              onClick={() => handleMarkComplete(level.id)}
                              className="mt-3 w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                            >
                              Mark as Complete
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                          )}

                          {index < levels.length - 1 && (
                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                              <div className="text-xs text-gray-400">
                                Next:{" "}
                                <span className="font-semibold text-blue-400">
                                  {level.nextLevel}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-2/12 flex justify-center">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-30 transition-all duration-500 ${
                            isCompleted
                              ? "bg-green-500 scale-110"
                              : isActive
                                ? `bg-gradient-to-br ${level.gradient} scale-125`
                                : `bg-gradient-to-br ${level.gradient} hover:scale-110`
                          } ${!isUnlocked ? "opacity-30" : ""}`}
                        >
                          {isCompleted ? (
                            <svg
                              className="w-8 h-8 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-white font-bold text-xl">
                              {level.id}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-5/12"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <ContributionCallToAction />
      </div>
      <Footer />
    </div>
  );
}
