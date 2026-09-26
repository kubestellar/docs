"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CURRENT_BRANCH } from "@/lib/url";

// Falls back to the production kubestellar.io property if the env var
// isn't set, matching the NEXT_PUBLIC_BASE_URL / NEXT_PUBLIC_BRANCH
// pattern in src/lib/url.ts. Not a secret — GA4 measurement IDs are
// public identifiers visible in every page's rendered HTML.
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-PXWNVQ8D1T";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/**
 * Only initialize GA4 for content that is actually published: the `main`
 * branch and pinned `docs/{version}` release branches (see netlify.toml
 * contexts). Netlify's `branch-deploy` context (every PR preview) builds
 * with NEXT_PUBLIC_BRANCH set to the source branch name, which matches
 * neither pattern, so preview/feature-branch traffic is excluded. Without
 * this guard, every PR preview would report page views and custom events
 * (docs_search, acmm_search, docs_edit_page_click, ...) into the single
 * production GA4 property, polluting real user metrics.
 */
export function isProductionDeploy(): boolean {
  return CURRENT_BRANCH === "main" || CURRENT_BRANCH.startsWith("docs/");
}

/**
 * Lightweight GA4 integration via gtag.js.
 * Drop into the root layout so every page gets automatic page_view tracking.
 */
export default function GoogleAnalytics() {
  if (!isProductionDeploy()) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
      {/* useSearchParams requires a Suspense boundary in the app router. */}
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  );
}

/**
 * The gtag('config', ...) call above only fires once, on the very first
 * full page load. Every subsequent in-app navigation (next/link, router.push)
 * is a client-side transition that never re-runs that script, so without
 * this tracker only the entry page of a visit was ever counted — multi-page
 * sessions were massively under-reported in GA4.
 *
 * This watches the route (pathname + query string) and sends an explicit
 * page_view event on every change, matching Google's documented pattern for
 * single-page apps: https://developers.google.com/analytics/devguides/collection/ga4/views
 */
/** Exported solely so tests can render it without the production-deploy gate. */
export function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Skips the mount-time run: the inline ga4-init script above already
  // sends a page_view for the page the user landed on, so firing here too
  // would double-count the entry page of every session.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window === "undefined" || !window.gtag) {
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Fire a custom GA4 event.  Safe to call before gtag loads — events queue
 * in the dataLayer and flush once the script is ready.
 */
export function gtagEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}
