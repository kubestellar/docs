// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/partners/page.tsx (baseline 0%, kubestellar/docs#7213).
 *
 * PartnersPage is a "use client" page rendering a local, data-driven
 * `partners` array twice (a desktop tripled-carousel and a mobile/tablet
 * grid), each entry using next-intl translations for its description plus
 * a `getLocalizedUrl`-wrapped Slack CTA link at the bottom.
 *
 * PageShell, next-intl, next/image, and next/link are mocked so this test
 * exercises only PartnersPage's own markup/branching logic, matching the
 * pattern used by src/__tests__/AboutSection.render.test.tsx.
 */

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    className,
  }: {
    alt: string;
    src: string;
    className?: string;
  }) => React.createElement("img", { alt, src, className }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...rest }, children),
}));

vi.mock("@/components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));
vi.mock("../components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));

afterEach(() => {
  cleanup();
});

const PARTNER_NAMES = [
  "ArgoCD",
  "FluxCD",
  "Kyverno",
  "MVI",
  "OpenZiti",
  "Turbonomic",
];

describe("PartnersPage", () => {
  it("renders the hero title/subtitle and every partner's name from the local data array", async () => {
    const { default: PartnersPage } = await import(
      "@/app/[locale]/partners/page"
    );
    const { getByText, getAllByText } = render(<PartnersPage />);

    expect(getByText("partnersPage.title")).not.toBeNull();
    expect(getByText("partnersPage.subtitle")).not.toBeNull();

    for (const name of PARTNER_NAMES) {
      // Each partner renders twice: once in the desktop tripled carousel
      // (x3) and once in the mobile/tablet grid (x1) = 4 occurrences.
      expect(getAllByText(name).length).toBe(4);
    }
  });

  it("renders each partner's description and logo image with an accessible alt text", async () => {
    const { default: PartnersPage } = await import(
      "@/app/[locale]/partners/page"
    );
    const { getAllByText, getAllByAltText } = render(<PartnersPage />);

    expect(
      getAllByText("partnersPage.partners.argocd.description").length
    ).toBeGreaterThan(0);
    expect(getAllByAltText("ArgoCD logo").length).toBeGreaterThan(0);
    expect(getAllByAltText("MVI logo").length).toBeGreaterThan(0);
  });

  it("links every partner card to its external link with safe rel/target attributes", async () => {
    const { default: PartnersPage } = await import(
      "@/app/[locale]/partners/page"
    );
    const { getAllByText } = render(<PartnersPage />);
    const argoCdLinks = getAllByText("ArgoCD").map(
      el => el.closest("a")!
    );
    expect(argoCdLinks.length).toBeGreaterThan(0);
    for (const link of argoCdLinks) {
      expect(link.getAttribute("href")).toBe("https://argo-cd.readthedocs.io/");
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("links MVI's card to the relative '/' link (partner without an external URL)", async () => {
    const { default: PartnersPage } = await import(
      "@/app/[locale]/partners/page"
    );
    const { getAllByText } = render(<PartnersPage />);
    const mviLinks = getAllByText("MVI").map(el => el.closest("a")!);
    expect(mviLinks.length).toBeGreaterThan(0);
    for (const link of mviLinks) {
      expect(link.getAttribute("href")).toBe("/");
    }
  });

  it("applies the white background styling branch for MVI and Turbonomic logos only", async () => {
    const { default: PartnersPage } = await import(
      "@/app/[locale]/partners/page"
    );
    const { getAllByAltText } = render(<PartnersPage />);
    const mviLogos = getAllByAltText("MVI logo");
    const argocdLogos = getAllByAltText("ArgoCD logo");
    expect(mviLogos[0].className).toContain("bg-white");
    expect(argocdLogos[0].className).not.toContain("bg-white");
  });

  it("renders the Slack CTA link with its path preserved through getLocalizedUrl", async () => {
    const { default: PartnersPage } = await import(
      "@/app/[locale]/partners/page"
    );
    const { container } = render(<PartnersPage />);
    // getLocalizedUrl rewrites kubestellar.io URLs to the current origin
    // (jsdom's default http://localhost:3000 in this test environment) while
    // preserving the path, so assert on the pathname rather than the host.
    const slackLink = container.querySelector('a[href$="/slack"]');
    expect(slackLink).not.toBeNull();
  });
});
