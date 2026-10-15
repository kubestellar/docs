// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for the two "use client" coming-soon route pages, both at 0%
 * baseline:
 *   - src/app/[locale]/coming-soon/page.tsx (linked from the playground
 *     page's router.replace("/coming-soon"))
 *   - src/app/[locale]/coming-soon-marketplace/page.tsx (a direct-navigation
 *     route with an embedded YouTube demo iframe, otherwise identical)
 *
 * Both render PageShell + translated hero copy + <ComingSoonCTA/>; the
 * marketplace variant adds a demo video section. PageShell and ComingSoonCTA
 * are mocked so this exercises only each page's own markup/translation
 * lookups, following the pattern used by QuickInstallationPage.test.tsx.
 */

const lookedUpKeys: string[] = [];
vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => {
    lookedUpKeys.push(`${ns}.${key}`);
    return `[${ns}.${key}]`;
  },
}));

vi.mock("@/components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));

vi.mock("@/components", () => ({
  ComingSoonCTA: () =>
    React.createElement("div", { "data-testid": "coming-soon-cta" }),
}));

afterEach(() => {
  cleanup();
  lookedUpKeys.length = 0;
});

describe("ComingSoonPage (/coming-soon)", () => {
  it("renders without throwing inside PageShell with the hero copy and CTA", async () => {
    const { default: ComingSoonPage } = await import(
      "@/app/[locale]/coming-soon/page"
    );
    const { getByTestId, getAllByText } = render(<ComingSoonPage />);

    expect(getByTestId("page-shell")).not.toBeNull();
    expect(getByTestId("coming-soon-cta")).not.toBeNull();
    expect(
      getAllByText("[comingSoonPage.statusBadge]").length
    ).toBeGreaterThan(0);
    expect(getAllByText("[comingSoonPage.title]").length).toBeGreaterThan(0);
    expect(
      getAllByText("[comingSoonPage.titleSpan]").length
    ).toBeGreaterThan(0);
  });

  it("looks up every translation key it renders", async () => {
    const { default: ComingSoonPage } = await import(
      "@/app/[locale]/coming-soon/page"
    );
    render(<ComingSoonPage />);
    for (const key of [
      "comingSoonPage.statusBadge",
      "comingSoonPage.title",
      "comingSoonPage.titleSpan",
      "comingSoonPage.subtitle",
      "comingSoonPage.description",
    ]) {
      expect(lookedUpKeys, `should look up ${key}`).toContain(key);
    }
    // This page never renders the demo section, unlike the marketplace
    // variant.
    expect(lookedUpKeys).not.toContain("comingSoonPage.demoTitle");
  });
});

describe("ComingSoonPage (/coming-soon-marketplace)", () => {
  it("renders without throwing with the hero copy, demo video iframe and CTA", async () => {
    const { default: ComingSoonMarketplacePage } = await import(
      "@/app/[locale]/coming-soon-marketplace/page"
    );
    const { getByTestId, getAllByText, container } = render(
      <ComingSoonMarketplacePage />
    );

    expect(getByTestId("page-shell")).not.toBeNull();
    expect(getByTestId("coming-soon-cta")).not.toBeNull();
    expect(
      getAllByText("[comingSoonPage.demoTitle]").length
    ).toBeGreaterThan(0);

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toBe(
      "https://www.youtube.com/embed/ZmuvEQJn98U?si=87ivMCi58ZKY3TBh"
    );
    expect(iframe!.getAttribute("referrerPolicy")).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  it("looks up every translation key it renders, including the demo section", async () => {
    const { default: ComingSoonMarketplacePage } = await import(
      "@/app/[locale]/coming-soon-marketplace/page"
    );
    render(<ComingSoonMarketplacePage />);
    for (const key of [
      "comingSoonPage.statusBadge",
      "comingSoonPage.title",
      "comingSoonPage.titleSpan",
      "comingSoonPage.subtitle",
      "comingSoonPage.description",
      "comingSoonPage.demoTitle",
      "comingSoonPage.demoSubtitle",
    ]) {
      expect(lookedUpKeys, `should look up ${key}`).toContain(key);
    }
  });
});
