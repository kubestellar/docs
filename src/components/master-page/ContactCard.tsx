"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export interface ContactCardConfig {
  /** Link destination (mailto:, external URL, etc.). */
  href: string;
  /** Whether the link points off-site; controls target="_blank"/rel. */
  external: boolean;
  /** className for the outer `<a>` wrapper (varies only in border hover color). */
  cardClassName: string;
  /** className for the circular icon badge wrapper (varies in size/background). */
  iconWrapperClassName: string;
  /** Icon markup rendered inside the circular icon badge. */
  icon: ReactNode;
  /** className for the "learn more" link text color (varies per card). */
  linkColorClassName: string;
  /** Translation key for the card title. */
  titleKey: string;
  /** Translation key for the card description. */
  descriptionKey: string;
  /** Translation key for the trailing link label. */
  linkKey: string;
}

/**
 * Renders one contact-method card in ContactSection's info list: an icon
 * badge, title, description, and an arrow-suffixed link label. Extracted
 * from ContactSection.tsx, which previously repeated this markup 5 times
 * with only the icon/colors/text varying.
 */
export default function ContactCard({
  href,
  external,
  cardClassName,
  iconWrapperClassName,
  icon,
  linkColorClassName,
  titleKey,
  descriptionKey,
  linkKey,
}: ContactCardConfig) {
  const t = useTranslations("contactSection");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cardClassName}
    >
      <div className="flex items-center">
        <div className={iconWrapperClassName}>{icon}</div>
        <div className="ml-3 sm:ml-5">
          <h3 className="text-base sm:text-lg font-medium text-white">
            {t(titleKey)}
          </h3>
          <p className="text-gray-300 mt-1 text-sm sm:text-base">
            {t(descriptionKey)}
          </p>
          <p
            className={`${linkColorClassName} mt-1 text-xs sm:text-sm inline-flex items-center`}
          >
            {t(linkKey)}
            <svg
              className="ml-1 w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </p>
        </div>
      </div>
    </a>
  );
}
