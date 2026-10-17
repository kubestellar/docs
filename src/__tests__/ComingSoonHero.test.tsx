// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/components/ComingSoonHero.tsx.
 *
 * Extracted from the previously-duplicated hero markup shared by
 * /coming-soon and /coming-soon-marketplace (see
 * ComingSoonPages.render.test.tsx for the page-level assertions). Pure-render
 * hero section under the `comingSoonPage` namespace, with an optional
 * `children` slot for the marketplace variant's demo-video section.
 */

const lookedUpKeys: string[] = [];
vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => {
    lookedUpKeys.push(`${ns}.${key}`);
    return `[${ns}.${key}]`;
  },
}));

import ComingSoonHero from "@/components/ComingSoonHero";

describe("ComingSoonHero", () => {
  afterEach(() => {
    cleanup();
    lookedUpKeys.length = 0;
  });

  it("renders the hero section without throwing", () => {
    const { container } = render(<ComingSoonHero />);
    expect(container.querySelector("section")).toBeTruthy();
  });

  it("looks up every comingSoonPage hero translation key it uses", () => {
    render(<ComingSoonHero />);
    for (const key of [
      "comingSoonPage.statusBadge",
      "comingSoonPage.title",
      "comingSoonPage.titleSpan",
      "comingSoonPage.subtitle",
      "comingSoonPage.description",
    ]) {
      expect(lookedUpKeys, `should look up ${key}`).toContain(key);
    }
  });

  it("renders nothing extra when no children are passed", () => {
    const { container } = render(<ComingSoonHero />);
    expect(container.querySelectorAll("section").length).toBe(1);
  });

  it("renders children after the hero section", () => {
    const { getByTestId, container } = render(
      <ComingSoonHero>
        <div data-testid="demo-section">demo</div>
      </ComingSoonHero>
    );
    expect(getByTestId("demo-section")).toBeTruthy();
    expect(container.querySelector("section")).toBeTruthy();
  });
});
