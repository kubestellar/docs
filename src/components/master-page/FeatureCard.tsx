"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

export interface FeatureCardConfig {
  /** Icon markup rendered inside the circular icon badge. */
  icon: ReactNode;
  /** className for the icon badge wrapper (varies slightly between cards). */
  iconWrapperClassName: string;
  /** className for the card's inner content wrapper (varies slightly between cards). */
  bodyClassName: string;
  /** Translation key for the card title. */
  titleKey: string;
  /** Translation keys for the card's paragraph(s), rendered in order. */
  descriptionKeys: string[];
  /** Destination used by the card's "learn more" Link and click handler. */
  href: string;
  /** Click handler attached to the whole card (router.push or window.open). */
  onClick: () => void;
}

/**
 * Renders one "feature card" in AboutSection's feature grid: an icon badge,
 * title, one or more description paragraphs, and an animated "learn more"
 * link. Extracted from AboutSection.tsx, which previously repeated this
 * markup 8 times with only the icon/text/target varying.
 */
export default function FeatureCard({
  icon,
  iconWrapperClassName,
  bodyClassName,
  titleKey,
  descriptionKeys,
  href,
  onClick,
}: FeatureCardConfig) {
  const t = useTranslations("aboutSection");

  return (
    <div
      className="feature-card relative group perspective cursor-pointer"
      onClick={onClick}
    >
      <div className="card-3d-container relative transition-all duration-500 group-hover:rotate-y-10 w-full h-full transform-style-3d">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-90 transition duration-500"></div>
        <div className={bodyClassName}>
          {/* Icon with animation */}
          <div className={iconWrapperClassName}>{icon}</div>

          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
            {t(titleKey)}
          </h3>

          {descriptionKeys.map((key) => (
            <p key={key} className="text-gray-300 mb-6">
              {t(key)}
            </p>
          ))}

          {/* Animated arrow on hover */}
          <Link href={href} className="block h-8 overflow-hidden">
            <div className="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300 text-primary-600 dark:text-primary-400 flex items-center">
              <span className="text-sm font-medium">{t("learnMore")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
