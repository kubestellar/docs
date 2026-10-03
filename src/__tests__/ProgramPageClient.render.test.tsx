// @vitest-environment jsdom
/**
 * Coverage for src/app/[locale]/programs/[slug]/ProgramPageClient.tsx
 * (baseline 0%). This "use client" component owns:
 *   1. a scroll-spy IntersectionObserver effect that drives `activeSection`
 *   2. a scrollToSection() click handler wired to the sidebar nav buttons
 *   3. conditional markup driven by `program.isPaid` and the length of
 *      `program.sections.resources`
 *
 * PageShell, Navbar/Footer and next-intl are mocked so this test exercises
 * only ProgramPageClient's own logic and branches.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  fireEvent,
  cleanup,
  within,
  act,
} from "@testing-library/react";
import React from "react";
import type { Program } from "@/app/[locale]/programs/programs";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    React.createElement("img", { alt, src }),
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

type ObserverCallback = (
  entries: Array<{ isIntersecting: boolean; target: Element }>
) => void;

let lastObserverCallback: ObserverCallback | null = null;
const observeMock = vi.fn();
const disconnectMock = vi.fn();

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    lastObserverCallback = callback;
  }
  observe = observeMock;
  unobserve = vi.fn();
  disconnect = disconnectMock;
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds: number[] = [];
}

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: "gsoc",
    name: "GSoC",
    fullName: "Google Summer of Code",
    description: "desc",
    logo: "/programs/gsoc.png",
    isPaid: true,
    theme: {
      gradient: "linear-gradient(135deg, #fff, #000)",
      primaryColor: "#fff",
      secondaryColor: "#000",
      floatingShapes: ["bg-yellow-500"],
    },
    sections: {
      benefits: "benefits text",
      description: "description text",
      overview: "overview text",
      eligibility: "eligibility text",
      timeline: "timeline text",
      structure: "structure text",
      howToApply: "howToApply text",
      resources: [
        { name: "Official Site", url: "https://example.com/gsoc" },
        { name: "FAQ", url: "https://example.com/faq" },
      ],
    },
    ...overrides,
  };
}

beforeEach(() => {
  lastObserverCallback = null;
  observeMock.mockClear();
  disconnectMock.mockClear();
  vi.stubGlobal(
    "IntersectionObserver",
    FakeIntersectionObserver as unknown as typeof IntersectionObserver
  );
  // jsdom doesn't implement scrollIntoView; stub it on the prototype so every
  // rendered <section id="..."> element (the real lookup target of both the
  // IntersectionObserver effect and scrollToSection) has a callable no-op.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("ProgramPageClient", () => {
  it("renders the paid-program badge and all sidebar/section content", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    const { getByText, getAllByText } = render(
      <ProgramPageClient program={makeProgram()} />
    );
    expect(getByText("Paid Program")).toBeTruthy();
    expect(getAllByText("programDetailsPage.overview").length).toBeGreaterThan(
      0
    );
    expect(
      getByText("programsPage.programs.gsoc.sections.benefits")
    ).toBeTruthy();
  });

  it("renders the volunteer badge when isPaid is false", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    const { getByText } = render(
      <ProgramPageClient program={makeProgram({ isPaid: false })} />
    );
    expect(getByText("Volunteer Program")).toBeTruthy();
    expect(getByText("Volunteer")).toBeTruthy();
  });

  it("renders every resource link and the Quick Actions shortcut to the first resource", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    const { getByText, getAllByText } = render(
      <ProgramPageClient program={makeProgram()} />
    );
    expect(getByText("Official Site")).toBeTruthy();
    expect(getByText("FAQ")).toBeTruthy();
    expect(getByText("Visit Official Website")).toBeTruthy();
    // the first resource's URL is shown in Quick Actions AND linked in the list
    expect(getAllByText("https://example.com/gsoc").length).toBeGreaterThan(0);
  });

  it('omits the Quick Actions "Visit Official Website" shortcut when resources is empty', async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    const { queryByText } = render(
      <ProgramPageClient
        program={makeProgram({
          sections: { ...makeProgram().sections, resources: [] },
        })}
      />
    );
    expect(queryByText("Visit Official Website")).toBeNull();
  });

  it("observes every section on mount and disconnects the observer on unmount", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    const { unmount } = render(<ProgramPageClient program={makeProgram()} />);
    expect(observeMock).toHaveBeenCalledTimes(8);
    expect(disconnectMock).not.toHaveBeenCalled();
    unmount();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });

  it("updates the active nav item when the IntersectionObserver reports an intersecting section", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    render(<ProgramPageClient program={makeProgram()} />);
    const benefitsTarget = document.getElementById("benefits")!;

    expect(lastObserverCallback).not.toBeNull();
    act(() => {
      lastObserverCallback!([{ isIntersecting: true, target: benefitsTarget }]);
    });

    const benefitsButton = within(document.querySelector("nav")!)
      .getByText("programDetailsPage.benefits")
      .closest("button");
    expect(benefitsButton?.className).toContain("nav-item-active");
  });

  it("ignores non-intersecting entries from the observer callback", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    render(<ProgramPageClient program={makeProgram()} />);
    const benefitsTarget = document.getElementById("benefits")!;

    act(() => {
      lastObserverCallback!([
        { isIntersecting: false, target: benefitsTarget },
      ]);
    });

    const overviewButton = within(document.querySelector("nav")!)
      .getByText("programDetailsPage.overview")
      .closest("button");
    expect(overviewButton?.className).toContain("nav-item-active");
  });

  it("scrolls to the clicked section via scrollIntoView", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    render(<ProgramPageClient program={makeProgram()} />);
    const eligibilityTarget = document.getElementById("eligibility")!;
    const scrollIntoViewMock = vi.fn();
    eligibilityTarget.scrollIntoView = scrollIntoViewMock;

    const eligibilityButton = within(document.querySelector("nav")!)
      .getByText("programDetailsPage.eligibility")
      .closest("button")!;
    fireEvent.click(eligibilityButton);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("does not throw when the clicked section element is missing from the DOM", async () => {
    const { default: ProgramPageClient } =
      await import("@/app/[locale]/programs/[slug]/ProgramPageClient");
    render(<ProgramPageClient program={makeProgram()} />);
    // Remove the real rendered section so scrollToSection's lookup misses.
    document.getElementById("timeline")!.remove();
    const timelineButton = within(document.querySelector("nav")!)
      .getByText("programDetailsPage.timeline")
      .closest("button")!;
    expect(() => fireEvent.click(timelineButton)).not.toThrow();
  });
});
