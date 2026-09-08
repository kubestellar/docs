// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

/**
 * Unit tests for GA4PageViewTracker in src/components/GoogleAnalytics.tsx.
 *
 * Next.js App Router client-side navigations never trigger a full page
 * load, so the inline gtag('config', ...) call only fires once for the
 * landing page. GA4PageViewTracker watches usePathname()/useSearchParams()
 * and must fire an explicit gtag('event', 'page_view', ...) on every route
 * change after the first render, while staying silent on the initial mount
 * (the inline config script already covers that page).
 */

const mockUsePathname = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

async function loadModule() {
  return import("../components/GoogleAnalytics");
}

describe("GA4PageViewTracker", () => {
  beforeEach(() => {
    vi.resetModules();
    window.gtag = vi.fn();
    mockUsePathname.mockReturnValue("/docs/getting-started");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not fire page_view on initial mount", async () => {
    const { GA4PageViewTracker } = await loadModule();
    render(<GA4PageViewTracker />);
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("fires page_view with path/location/title on route change", async () => {
    const { GA4PageViewTracker } = await loadModule();
    const { rerender } = render(<GA4PageViewTracker />);
    expect(window.gtag).not.toHaveBeenCalled();

    mockUsePathname.mockReturnValue("/docs/installation");
    rerender(<GA4PageViewTracker />);

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({
        page_path: "/docs/installation",
        page_location: window.location.href,
        page_title: document.title,
      }),
    );
  });

  it("includes query string in page_path when search params are present", async () => {
    const { GA4PageViewTracker } = await loadModule();
    const { rerender } = render(<GA4PageViewTracker />);

    mockUsePathname.mockReturnValue("/docs/search");
    mockUseSearchParams.mockReturnValue(new URLSearchParams("q=telemetry"));
    rerender(<GA4PageViewTracker />);

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({
        page_path: "/docs/search?q=telemetry",
      }),
    );
  });

  it("does not throw and skips firing when gtag is not yet loaded", async () => {
    const { GA4PageViewTracker } = await loadModule();
    // @ts-expect-error simulating gtag not yet loaded
    delete window.gtag;
    const { rerender } = render(<GA4PageViewTracker />);

    mockUsePathname.mockReturnValue("/docs/next-page");
    expect(() => rerender(<GA4PageViewTracker />)).not.toThrow();
  });
});
