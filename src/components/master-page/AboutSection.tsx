"use client";

import { GridLines, StarField } from "../index";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFeatureCardAnimations } from "../../hooks/useFeatureCardAnimations";
import FeatureCard, { type FeatureCardConfig } from "./FeatureCard";

// Icon badge / content-wrapper classNames shared by every card except the
// one-off variants noted inline below (preserved verbatim from the markup
// this array replaces).
const ICON_WRAPPER_CLASSNAME =
  "w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300";
const BODY_CLASSNAME =
  "relative bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg p-8 transition-all duration-300 transform group-hover:translate-y-[-8px] group-hover:shadow-xl border border-gray-700/50 flex flex-col justify-between h-full";

export default function AboutSection() {
  const t = useTranslations("aboutSection");
  const router = useRouter();
  useFeatureCardAnimations();

  // Rendered in this order (1,2,3,4,5,7,8,6) to match the original markup;
  // the gap in numbering predates this refactor.
  const featureCards: FeatureCardConfig[] = [
    {
      // Feature 1 - Advanced card with 3D hover effect
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 12h14M12 5l7 7-7 7"
          />
        </svg>
      ),
      iconWrapperClassName: ICON_WRAPPER_CLASSNAME,
      // Card 1 carries a duplicated "h-full" class in the original markup;
      // preserved verbatim (harmless no-op in Tailwind's cascade).
      bodyClassName:
        "relative bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg p-8 transition-all duration-300 transform group-hover:translate-y-[-8px] group-hover:shadow-xl border border-gray-700/50 h-full flex flex-col justify-between h-full",
      titleKey: "card1Title",
      descriptionKeys: ["card1Description"],
      href: "/docs/console/ai-integration/ai-features",
      onClick: () => router.push("/docs/console/ai-integration/ai-features"),
    },
    {
      // Feature 2 - Advanced card with 3D hover effect
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      iconWrapperClassName: ICON_WRAPPER_CLASSNAME,
      bodyClassName: BODY_CLASSNAME,
      titleKey: "card2Title",
      descriptionKeys: ["card2Description"],
      href: "/docs/console/features/dashboards",
      onClick: () => router.push("/docs/console/features/dashboards"),
    },
    {
      // Feature 3 - Advanced card with 3D hover effect
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      iconWrapperClassName: ICON_WRAPPER_CLASSNAME,
      bodyClassName: BODY_CLASSNAME,
      titleKey: "card3Title",
      descriptionKeys: ["card3Description"],
      href: "/docs/console/programs/marketplace",
      onClick: () => router.push("/docs/console/programs/marketplace"),
    },
    {
      // Feature 4 - Coming from Lens Advanced card with 3D hover effect
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.1973 9C17.0976 8.82774 16.9896 8.66089 16.8739 8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.811 13.5C17.2683 15.6084 15.6084 17.2683 13.5 17.811"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      iconWrapperClassName: ICON_WRAPPER_CLASSNAME,
      bodyClassName: BODY_CLASSNAME,
      titleKey: "card4Title",
      descriptionKeys: ["card4Description", "card4Details"],
      href: "https://console.kubestellar.io/from-lens",
      onClick: () => window.open("https://console.kubestellar.io/from-lens", "_blank"),
    },
    {
      // Feature 5 - Coming from Headlamp Advanced card with 3D hover effect
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.0512 15.75L9.51642 14.2768L9.18821 14.0137C8.15637 13.1865 7.5 11.9204 7.5 10.5C7.5 8.01472 9.51472 6 12 6C14.4853 6 16.5 8.01472 16.5 10.5C16.5 11.9204 15.8436 13.1865 14.8118 14.0137L14.4836 14.2768L13.9488 15.75H10.0512ZM9 17.25H15L15.75 15.184C17.1217 14.0844 18 12.3948 18 10.5C18 7.18629 15.3137 4.5 12 4.5C8.68629 4.5 6 7.18629 6 10.5C6 12.3948 6.87831 14.0844 8.25 15.184L9 17.25ZM14.25 19.5V18H9.75V19.5H14.25Z"
            fill="currentColor"
          ></path>
        </svg>
      ),
      iconWrapperClassName: ICON_WRAPPER_CLASSNAME,
      bodyClassName: BODY_CLASSNAME,
      titleKey: "card5Title",
      descriptionKeys: ["card5Description", "card5Details"],
      href: "https://console.kubestellar.io/from-headlamp",
      onClick: () => window.open("https://console.kubestellar.io/from-headlamp", "_blank"),
    },
    {
      // Feature 7 - From HolmesGPT card with 3D hover effect
      icon: "🔎︎",
      iconWrapperClassName: `text-2xl ${ICON_WRAPPER_CLASSNAME}`,
      bodyClassName: BODY_CLASSNAME,
      titleKey: "card7Title",
      descriptionKeys: ["card7Description", "card7Details"],
      href: "https://console.kubestellar.io/from-holmesgpt",
      onClick: () => window.open("https://console.kubestellar.io/from-holmesgpt", "_blank"),
    },
    {
      // Feature 8 - User Reviews Advanced card with 3D hover effect
      icon: "🎭︎",
      iconWrapperClassName: `${ICON_WRAPPER_CLASSNAME} text-2xl`,
      bodyClassName: BODY_CLASSNAME,
      titleKey: "card8Title",
      descriptionKeys: ["card8Description", "card8Details"],
      href: "docs/news/reviews",
      onClick: () => router.push("docs/news/reviews"),
    },
    {
      // Feature 6 - Advanced WhiteLabel card with 3D hover effect
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15,12a1,1,0,1,0,1-1A1,1,0,0,0,15,12Zm6.71-.71-5-5A1,1,0,0,0,16,6H5A3,3,0,0,0,2,9v6a3,3,0,0,0,3,3H16a1,1,0,0,0,.71-.29l5-5A1,1,0,0,0,21.71,11.29ZM15.59,16H5a1,1,0,0,1-1-1V9A1,1,0,0,1,5,8H15.59l4,4Z"></path>
        </svg>
      ),
      iconWrapperClassName: ICON_WRAPPER_CLASSNAME,
      bodyClassName: BODY_CLASSNAME,
      titleKey: "card6Title",
      descriptionKeys: ["card6Description", "card6Details"],
      href: "https://console.kubestellar.io/white-label",
      onClick: () => window.open("https://console.kubestellar.io/white-label", "_blank"),
    },
  ];

  return (
    <section
      id="about"
      className="relative py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden"
    >
      {/* Anchor for key-features navigation link */}
      <div id="key-features" className="absolute top-0 left-0" aria-hidden="true"></div>
      {/* Dark base background */}
      <div className="absolute inset-0 bg-[#0a0a0a]"></div>

      {/* Starfield background */}
      <StarField density="medium" showComets={true} cometCount={3} />

      {/* Grid lines background */}
      <GridLines horizontalLines={21} verticalLines={15} />

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-50 -right-20 z-3 h-84 w-84 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-[60px] flex-none order-3 grow-0"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-[2.4rem]">
            {t("title")}{" "}
            <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
              {t("titleSpan")}
            </span>
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-20 grid gap-10 gap-y-20 lg:grid-cols-3 feature-cards">
          {featureCards.map((card) => (
            <FeatureCard key={card.titleKey} {...card} />
          ))}
        </div>
        <div className="mt-20 flex flex-col items-center text-center relative z-10 space-y-4">
          <p className="max-w-3xl text-lg text-gray-300">
            {t("appendix")}
          </p>

          <Link
            href="/docs/introduction"
            className="inline-flex items-center gap-1 text-primary-400 font-medium transition-all duration-200 hover:text-primary-300 hover:underline cursor-pointer"
          >
            {t("learnMore")}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition-transform duration-200 hover:translate-x-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
      
    </section>
  );
}
