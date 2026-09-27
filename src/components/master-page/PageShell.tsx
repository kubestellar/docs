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
  /** Class applied to the fixed-position background wrapper. */
  wrapperClassName?: string;
  /**
   * Class applied to the opaque base layer that sits under the animated
   * layers. Set to `false` to omit the base layer entirely (rare — the
   * canonical scaffold always renders it so the animations have an
   * opaque backdrop even before the stars/grid effects run).
   */
  baseLayerClassName?: string | false;
}

export interface PageShellProps {
  children: ReactNode;
  /** Optional overrides for the shared page-scaffold background. */
  background?: PageShellBackground;
  /**
   * Class applied to the outer shell `<div>`. Defaults to the canonical
   * dark shell (`bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen`).
   * Pass a custom class only when the page intentionally diverges from
   * the site-wide dark backdrop; the port PRs against #7106 keep this
   * default on every ported page.
   */
  className?: string;
  /**
   * Class applied to the `<div>` wrapping `children`. Defaults to the
   * canonical content wrapper (`relative z-10 pt-7`), which stacks the
   * page above the fixed background layer and offsets for the fixed
   * navbar. Pass `null` to omit the wrapper entirely — pages with a
   * bespoke hero (e.g. `products`, `programs`) provide their own inner
   * `<div className="relative z-10 …">` inside `children`.
   */
  contentClassName?: string | null;
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

// Canonical Tailwind classes extracted from the seven pages that share
// the exact same scaffold today (leaderboard, leaderboard/[username],
// partners, products, programs, ladder, programs/[slug]). See
// kubestellar/docs#7106 for the source-of-truth grep.
export const DEFAULT_OUTER_CLASS =
  "bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen";
export const DEFAULT_BACKGROUND_WRAPPER_CLASS = "fixed inset-0 z-0";
export const DEFAULT_BASE_LAYER_CLASS = "absolute inset-0 bg-[#0a0a0a]";
export const DEFAULT_CONTENT_CLASS = "relative z-10 pt-7";

/**
 * Shared page-scaffold shell for `src/app/[locale]/*` route pages.
 *
 * Composes the site-wide {@link Navbar}, a fixed-position background
 * layer (opaque base + {@link StarField} + {@link GridLines}), a
 * content wrapper stacked above the background, and the site-wide
 * {@link Footer}. Owns the canonical prop values that seven page.tsx
 * files currently restate independently.
 *
 * DOM shape produced by the default configuration:
 *
 * ```
 * <div class="bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen">
 *   <Navbar />
 *   <div class="fixed inset-0 z-0">
 *     <div class="absolute inset-0 bg-[#0a0a0a]" />
 *     <StarField density="medium" showComets cometCount={3} />
 *     <GridLines horizontalLines={21} verticalLines={18} />
 *   </div>
 *   <div class="relative z-10 pt-7">{children}</div>
 *   <Footer />
 * </div>
 * ```
 *
 * Set `background.grid: false` or `background.stars: false` to drop a
 * layer; set `background.baseLayerClassName: false` to drop the base
 * (rare). Set `contentClassName: null` to skip the content wrapper —
 * pages with a bespoke hero (e.g. `products`, `programs`) provide
 * their own `<div className="relative z-10 …">` inside `children`.
 *
 * Filed as interface extraction for kubestellar/docs#7106.
 */
export default function PageShell({
  children,
  background,
  className,
  contentClassName,
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

  const baseLayerClass =
    background?.baseLayerClassName === false
      ? null
      : (background?.baseLayerClassName ?? DEFAULT_BASE_LAYER_CLASS);

  const backgroundWrapperClass =
    background?.wrapperClassName ?? DEFAULT_BACKGROUND_WRAPPER_CLASS;

  const showBackground =
    gridProps !== null || starsProps !== null || baseLayerClass !== null;

  const resolvedContentClass =
    contentClassName === null
      ? null
      : (contentClassName ?? DEFAULT_CONTENT_CLASS);

  return (
    <div
      className={className ?? DEFAULT_OUTER_CLASS}
      data-testid="page-shell"
    >
      <Navbar />
      {showBackground && (
        <div
          className={backgroundWrapperClass}
          data-testid="page-shell-background"
        >
          {baseLayerClass !== null && (
            <div
              className={baseLayerClass}
              data-testid="page-shell-base-layer"
            />
          )}
          {starsProps && <StarField {...starsProps} />}
          {gridProps && <GridLines {...gridProps} />}
        </div>
      )}
      {resolvedContentClass === null ? (
        children
      ) : (
        <div
          className={resolvedContentClass}
          data-testid="page-shell-content"
        >
          {children}
        </div>
      )}
      {showFooter && <Footer />}
    </div>
  );
}
