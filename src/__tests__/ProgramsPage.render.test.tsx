// @vitest-environment jsdom
/**
 * Coverage for src/app/[locale]/programs/page.tsx (baseline 0%).
 *
 * This "use client" page renders the full programs list from
 * getAllPrograms() and branches on `program.isPaid` for both the card's
 * hover-border class and the paid/unpaid badge text. next-intl, next/image
 * and the `@/i18n/navigation` Link are mocked so this test exercises only
 * ProgramsPage's own markup and branching, not its dependencies.
 */
import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    React.createElement("img", { alt, src }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
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

import ProgramsPage from "@/app/[locale]/programs/page";
import { programs } from "@/app/[locale]/programs/programs";

describe("ProgramsPage", () => {
  it("renders the hero copy and one card per program", () => {
    const { getByText, getAllByRole } = render(<ProgramsPage />);

    expect(getByText("programsPage.title")).toBeTruthy();
    expect(getByText("programsPage.titleSpan")).toBeTruthy();
    expect(getByText("programsPage.subtitle")).toBeTruthy();

    const links = getAllByRole("link");
    expect(links).toHaveLength(programs.length);
    programs.forEach((program) => {
      expect(
        links.find((link) => link.getAttribute("href") === `/programs/${program.id}`)
      ).toBeTruthy();
    });
  });

  it("renders the paid badge and blue hover border for paid programs", () => {
    const { getAllByRole } = render(<ProgramsPage />);
    const paidProgram = programs.find((p) => p.isPaid);
    expect(paidProgram).toBeTruthy();

    const link = getAllByRole("link").find(
      (l) => l.getAttribute("href") === `/programs/${paidProgram!.id}`
    )!;
    expect(link.className).toContain("hover:border-blue-500/50");
    expect(within(link).getByText("programsPage.paid")).toBeTruthy();
  });

  it("renders the unpaid badge and purple hover border for unpaid programs", () => {
    const { getAllByRole } = render(<ProgramsPage />);
    const unpaidProgram = programs.find((p) => !p.isPaid);
    expect(unpaidProgram).toBeTruthy();

    const link = getAllByRole("link").find(
      (l) => l.getAttribute("href") === `/programs/${unpaidProgram!.id}`
    )!;
    expect(link.className).toContain("hover:border-purple-500/50");
    expect(within(link).getByText("programsPage.unpaid")).toBeTruthy();
  });
});
