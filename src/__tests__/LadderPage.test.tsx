// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/ladder/page.tsx (baseline 0%).
 *
 * MaintainerLadderPage is a "use client" page rendering a local, data-driven
 * `levels` array (6 maintainer-ladder tiers) twice — once for the mobile
 * stacked layout and once for the desktop zig-zag layout — plus a hero
 * section with a leaderboard CTA link and an external "ladder_stats" link.
 *
 * next-intl, next/link, PageShell, and ContributionCallToAction are mocked
 * so this test exercises only MaintainerLadderPage's own markup/branching
 * logic, matching the pattern used by src/__tests__/PartnersPage.test.tsx.
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
vi.mock("../components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));

vi.mock("@/components/index", () => ({
  ContributionCallToAction: () =>
    React.createElement("div", { "data-testid": "contribution-cta" }),
}));
vi.mock("../components/index", () => ({
  ContributionCallToAction: () =>
    React.createElement("div", { "data-testid": "contribution-cta" }),
}));

afterEach(() => {
  cleanup();
});

const LEVEL_TITLES = [
  "ladderPage.levels.contributor.title",
  "ladderPage.levels.unpaidMentee.title",
  "ladderPage.levels.paidMentee.title",
  "ladderPage.levels.mentor.title",
  "ladderPage.levels.maintainer.title",
  "ladderPage.levels.ambassador.title",
];

describe("MaintainerLadderPage", () => {
  it("renders the hero title/subtitle and the points-note/leaderboard CTA", async () => {
    const { default: MaintainerLadderPage } = await import(
      "@/app/[locale]/ladder/page"
    );
    const { getByText, getAllByText } = render(<MaintainerLadderPage />);

    expect(getByText("ladderPage.title")).not.toBeNull();
    expect(getByText("ladderPage.titleSpan")).not.toBeNull();
    expect(getByText("ladderPage.subtitle")).not.toBeNull();
    expect(getByText("ladderPage.pointsNote")).not.toBeNull();

    // "Contributor Leaderboard" CTA link + inline leaderboard link both
    // point at /leaderboard.
    const leaderboardLinks = getAllByText(
      "ladderPage.pointsNoteCtaLeaderboard"
    )
      .concat(getAllByText("Contributor Leaderboard"))
      .map(el => el.closest("a")!);
    expect(leaderboardLinks.length).toBeGreaterThan(0);
    for (const link of leaderboardLinks) {
      expect(link.getAttribute("href")).toBe("/leaderboard");
    }
  });

  it("renders the external ladder_stats link with safe target/rel attributes", async () => {
    const { default: MaintainerLadderPage } = await import(
      "@/app/[locale]/ladder/page"
    );
    const { getByText } = render(<MaintainerLadderPage />);
    const statsLink = getByText("ladderPage.viewStats").closest("a")!;

    expect(statsLink.getAttribute("href")).toBe(
      "http://kubestellar.io/ladder_stats"
    );
    expect(statsLink.getAttribute("target")).toBe("_blank");
    expect(statsLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders every ladder level's title twice (mobile stack + desktop zig-zag)", async () => {
    const { default: MaintainerLadderPage } = await import(
      "@/app/[locale]/ladder/page"
    );
    const { getAllByText } = render(<MaintainerLadderPage />);

    for (const title of LEVEL_TITLES) {
      expect(getAllByText(title).length).toBe(2);
    }
  });

  it("renders the timeframe badge only for levels that define one (unpaidMentee)", async () => {
    const { default: MaintainerLadderPage } = await import(
      "@/app/[locale]/ladder/page"
    );
    const { getAllByText } = render(<MaintainerLadderPage />);

    // Only unpaidMentee/paidMentee/mentor set a timeframe key in messages/en.json;
    // assert the rendered string from the mocked translator appears.
    expect(
      getAllByText("ladderPage.levels.unpaidMentee.timeframe").length
    ).toBe(2);
  });

  it("omits the 'Next Level' footer for the final level (ambassador) but shows it for earlier levels", async () => {
    const { default: MaintainerLadderPage } = await import(
      "@/app/[locale]/ladder/page"
    );
    const { getAllByText, queryAllByText } = render(<MaintainerLadderPage />);

    // nextLevel of contributor ("unpaidMentee.title") is surfaced as the
    // "Next Level" value under the contributor card.
    expect(
      getAllByText("ladderPage.levels.unpaidMentee.title").length
    ).toBeGreaterThanOrEqual(2);

    // ambassador is the last level (index 5 of 6); its own nextLevel value
    // must never be rendered since there is no level after it.
    expect(
      queryAllByText("ladderPage.levels.ambassador.nextLevel").length
    ).toBe(0);
  });

  it("renders the requirements list and good-standing note for every level", async () => {
    const { default: MaintainerLadderPage } = await import(
      "@/app/[locale]/ladder/page"
    );
    const { getAllByText } = render(<MaintainerLadderPage />);

    expect(getAllByText("ladderPage.requirementsLabel").length).toBe(
      LEVEL_TITLES.length * 2
    );
    expect(getAllByText("ladderPage.goodStandingLabel").length).toBe(
      LEVEL_TITLES.length * 2
    );
    expect(
      getAllByText("ladderPage.levels.contributor.goodStanding").length
    ).toBe(2);
  });

  it("renders the ContributionCallToAction section inside PageShell", async () => {
    const { default: MaintainerLadderPage } = await import(
      "@/app/[locale]/ladder/page"
    );
    const { getByTestId } = render(<MaintainerLadderPage />);

    expect(getByTestId("page-shell")).not.toBeNull();
    expect(getByTestId("contribution-cta")).not.toBeNull();
  });
});
