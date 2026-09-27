"use client";

import type { ReactNode } from "react";
import { Footer, GridLines, Navbar, StarField } from "../index";

// Prop shapes here mirror the (unexported) props of the underlying
// animation widgets. They are duplicated on purpose: forwarding
// `Partial<T>` through the barrel would couple this shell to the
// widgets' internal types without buying test-time safety, and the
// underlying files are excluded from the coverage config anyway (see
// vitest.config.ts — `src/components/animations/**/*.tsx` is excluded).
export interface GridLinesOverrides {
  horizontalLines?: number;
  verticalLines?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  speed?: number;
  opacity?: number;
  className?: string;
}

export interface StarFieldOverrides {
  density?: "low" | "medium" | "high";
  showComets?: boolean;
  cometCount?: number;
  className?: string;
}

export interface PageShellBackground {
  /** GridLines overrides, or `false` to omit the grid entirely. */
  grid?: GridLinesOverrides | false;
  /** StarField overrides, or `false` to omit the starfield entirely. */
  stars?: StarFieldOverrides | false;
  /** Class applied to the absolutely-positioned background wrapper. */
  wrapperClassName?: string;
}

export interface PageShellProps {
  children: ReactNode;
  /** Optional overrides for the shared page-scaffold background. */
  background?: PageShellBackground;
  /** Class applied to the outer shell wrapper. */
  className?: string;
  /** Render the site-wide Footer at the end. Defaults to `true`. */
  showFooter?: boolean;
}

// Canonical defaults extracted from the eight pages that already share
// the same scaffold (leaderboard, leaderboard/[username], partners,
// products, programs, ladder, programs/[slug], and the shared shape
// contribute-handbook / marketplace / quick-installation intentionally
// vary from). See kubestellar/docs#7106 for the full drift matrix.
export const DEFAULT_GRID: Required<
  Pick<GridLinesOverrides, "horizontalLines" | "verticalLines">
> = {
  horizontalLines: 21,
  verticalLines: 18,
};

export const DEFAULT_STARS: Required<
  Pick<StarFieldOverrides, "density" | "showComets" | "cometCount">
> = {
  density: "medium",
  showComets: true,
  cometCount: 3,
};

const DEFAULT_BACKGROUND_WRAPPER_CLASS =
  "absolute inset-0 -z-10 overflow-hidden pointer-events-none";

/**
 * Shared page-scaffold shell for `src/app/[locale]/*` route pages.
 *
 * Composes the site-wide {@link Navbar}, the {@link GridLines} +
 * {@link StarField} background decoration, and the site-wide
 * {@link Footer}. Owns the canonical prop values that eight page.tsx
 * files currently restate independently; three variant pages
 * (contribute-handbook, marketplace, quick-installation) pass explicit
 * `background.stars` overrides.
 *
 * Set `background.grid: false` or `background.stars: false` to omit
 * either layer. Set `showFooter: false` for pages that render their
 * own footer (or none at all).
 *
 * Filed as interface extraction for kubestellar/docs#7106; no page.tsx
 * has been ported to it yet. See the issue for the per-page port plan.
 */
export default function PageShell({
  children,
  background,
  className,
  showFooter = true,
}: PageShellProps) {
  const gridProps =
    background?.grid === false
      ? null
      : { ...DEFAULT_GRID, ...(background?.grid ?? {}) };

  const starsProps =
    background?.stars === false
      ? null
      : { ...DEFAULT_STARS, ...(background?.stars ?? {}) };

  const showBackground = gridProps !== null || starsProps !== null;
  const wrapperClass =
    background?.wrapperClassName ?? DEFAULT_BACKGROUND_WRAPPER_CLASS;

  return (
    <div className={className} data-testid="page-shell">
      <Navbar />
      {showBackground && (
        <div className={wrapperClass} data-testid="page-shell-background">
          {gridProps && <GridLines {...gridProps} />}
          {starsProps && <StarField {...starsProps} />}
        </div>
      )}
      {children}
      {showFooter && <Footer />}
    </div>
  );
}
