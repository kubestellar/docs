"use client";

import Script from "next/script";

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
    </>
  );
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
