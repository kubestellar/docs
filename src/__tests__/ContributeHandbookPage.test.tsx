// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/contribute-handbook/page.tsx (baseline 0%
 * unit, no repo e2e suite — this is the only coverage evidence available).
 *
 * CommunityHandbook is a "use client" page rendering the local, data-driven
 * `handbookCards` array (from ./handbook) plus a scroll-driven "back to
 * top" button whose visibility classes toggle on the window `scroll` event.
 * Each card runs its id through a local translation-key map with a
 * fallback to the raw id for unmapped cards ("codeGuidelines" and
 * "docsGuidelines" are not in the map).
 *
 * PageShell, next-intl, and next/link are mocked so this test exercises
 * only CommunityHandbook's own markup/branching logic, matching the
 * pattern used by src/__tests__/PartnersPage.test.tsx and
 * src/__tests__/ProductsPage.test.tsx.
 */

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
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

afterEach(() => {
  cleanup();
});

describe("CommunityHandbook (contribute-handbook/page.tsx)", () => {
  it("renders the hero title and every handbook card with its mapped translation key", async () => {
    const { default: CommunityHandbook } = await import(
      "@/app/[locale]/contribute-handbook/page"
    );
    const { getByText, getAllByText } = render(<CommunityHandbook />);

    expect(getByText("communityHandbook.title")).not.toBeNull();
    expect(getByText("communityHandbook.titleSpan")).not.toBeNull();

    // Mapped ids resolve through translationKeyMap.
    expect(
      getByText("communityHandbook.cards.onboarding.title")
    ).not.toBeNull();
    expect(
      getByText("communityHandbook.cards.codeOfConduct.title")
    ).not.toBeNull();
    expect(getByText("communityHandbook.cards.license.title")).not.toBeNull();
    expect(
      getByText("communityHandbook.cards.governance.title")
    ).not.toBeNull();
    expect(getByText("communityHandbook.cards.testing.title")).not.toBeNull();
    expect(
      getByText("communityHandbook.cards.packaging.title")
    ).not.toBeNull();
    expect(
      getByText("communityHandbook.cards.releaseProcess.title")
    ).not.toBeNull();
    expect(
      getByText("communityHandbook.cards.releaseTesting.title")
    ).not.toBeNull();
    expect(
      getByText("communityHandbook.cards.signoffSigning.title")
    ).not.toBeNull();

    // "codeGuidelines" and "docsGuidelines" are not in translationKeyMap,
    // so the fallback (`translationKeyMap[cardId] || cardId`) uses the raw
    // card id as the translation key instead.
    expect(
      getByText("communityHandbook.cards.codeGuidelines.title")
    ).not.toBeNull();
    expect(
      getByText("communityHandbook.cards.docsGuidelines.title")
    ).not.toBeNull();

    expect(getAllByText("communityHandbook.learnMore").length).toBe(12);
  });

  it("links each card to its handbook destination", async () => {
    const { default: CommunityHandbook } = await import(
      "@/app/[locale]/contribute-handbook/page"
    );
    const { getByText } = render(<CommunityHandbook />);

    const onboardingLink = getByText(
      "communityHandbook.cards.onboarding.title"
    ).closest("a");
    expect(onboardingLink?.getAttribute("href")).toBe(
      "/docs/contributing/onboarding"
    );

    const signoffLink = getByText(
      "communityHandbook.cards.signoffSigning.title"
    ).closest("a");
    expect(signoffLink?.getAttribute("href")).toBe(
      "/docs/contributing/sign-off"
    );
  });

  it("toggles the back-to-top button's visibility classes based on scroll position", async () => {
    const { default: CommunityHandbook } = await import(
      "@/app/[locale]/contribute-handbook/page"
    );
    const { container } = render(<CommunityHandbook />);

    const button = container.querySelector(
      "#back-to-top"
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.classList.contains("opacity-0")).toBe(true);
    expect(button.classList.contains("opacity-100")).toBe(false);

    Object.defineProperty(window, "scrollY", {
      value: 500,
      configurable: true,
    });
    fireEvent.scroll(window);

    expect(button.classList.contains("opacity-100")).toBe(true);
    expect(button.classList.contains("opacity-0")).toBe(false);

    Object.defineProperty(window, "scrollY", {
      value: 0,
      configurable: true,
    });
    fireEvent.scroll(window);

    expect(button.classList.contains("opacity-0")).toBe(true);
    expect(button.classList.contains("opacity-100")).toBe(false);
  });

  it("scrolls to top when the back-to-top button is clicked", async () => {
    const { default: CommunityHandbook } = await import(
      "@/app/[locale]/contribute-handbook/page"
    );
    const { container } = render(<CommunityHandbook />);

    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;

    const button = container.querySelector(
      "#back-to-top"
    ) as HTMLButtonElement;
    fireEvent.click(button);

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("removes the scroll listener on unmount", async () => {
    const { default: CommunityHandbook } = await import(
      "@/app/[locale]/contribute-handbook/page"
    );
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<CommunityHandbook />);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });
});
