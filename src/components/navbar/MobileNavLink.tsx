"use client";

import Link from "next/link";
import { Link as LocalizedLink } from "@/i18n/navigation";

const LINK_CLASS_NAME =
  "text-sm sm:text-base font-medium text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-lg";

interface MobileNavLinkProps {
  href: string;
  label: string;
  /** SVG icon markup (the `<svg>...</svg>` element only). */
  icon: React.ReactNode;
  /** Which link primitive to render. Defaults to the plain Next.js `Link`. */
  as?: "link" | "localizedLink" | "anchor";
  /** Opens the anchor in a new tab with `rel="noopener noreferrer"` (anchor only). */
  openInNewTab?: boolean;
  /** Wraps the icon in a `<div className="relative">` and the label in a `<span>`,
   *  matching the markup some call sites relied on. */
  wrapChildren?: boolean;
  /** Outer wrapper spacing, e.g. "mb-2" or "mb-4". */
  spacingClassName?: string;
}

/**
 * Shared "icon + label" row used across the mobile nav menu's link groups
 * (top links, community, contribute). Consolidates markup that was
 * previously hand-duplicated at 14 call sites across 3 components.
 */
export default function MobileNavLink({
  href,
  label,
  icon,
  as = "link",
  openInNewTab = false,
  wrapChildren = true,
  spacingClassName = "mb-2",
}: MobileNavLinkProps) {
  const children = wrapChildren ? (
    <>
      <div className="relative">{icon}</div>
      <span>{label}</span>
    </>
  ) : (
    <>
      {icon}
      {label}
    </>
  );

  return (
    <div className={`relative ${spacingClassName}`}>
      {as === "anchor" ? (
        <a
          href={href}
          className={LINK_CLASS_NAME}
          {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      ) : as === "localizedLink" ? (
        <LocalizedLink href={href} className={LINK_CLASS_NAME}>
          {children}
        </LocalizedLink>
      ) : (
        <Link href={href} className={LINK_CLASS_NAME}>
          {children}
        </Link>
      )}
    </div>
  );
}
