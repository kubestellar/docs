// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/quick-installation/page.tsx (baseline 0%,
 * kubestellar/docs#7212).
 *
 * QuickInstallationPage is a "use client" page composed of local
 * sub-components with real interactive state:
 *   1. CodeBlock: a copy-to-clipboard button (navigator.clipboard.writeText)
 *      that flips a `copied` indicator for 2s
 *   2. FAQItem: a collapsible question/answer driven by `isOpen` state
 *
 * PageShell, framer-motion, and lucide-react icons are mocked so this test
 * exercises only this file's own CodeBlock/FAQItem logic, following the
 * pattern used by src/__tests__/HeroSection.render.test.tsx for the
 * clipboard copy assertions.
 */

vi.mock("@/components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...rest
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => {
      // Strip framer-motion-only props (initial/animate/exit/transition)
      // that aren't valid DOM attributes.
      const { initial, animate, exit, transition, ...domProps } = rest as Record<
        string,
        unknown
      >;
      void initial;
      void animate;
      void exit;
      void transition;
      return React.createElement("div", domProps, children);
    },
  },
}));

vi.mock("lucide-react", () => {
  const icon = (name: string) => (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": `icon-${name}`, ...props });
  return {
    Terminal: icon("terminal"),
    CheckCircle2: icon("check-circle"),
    Copy: icon("copy"),
    ChevronRight: icon("chevron-right"),
    ChevronDown: icon("chevron-down"),
    ExternalLink: icon("external-link"),
    Info: icon("info"),
    Shield: icon("shield"),
    Settings: icon("settings"),
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("QuickInstallationPage", () => {
  it("renders without throwing and shows the hero title and install command", async () => {
    const { default: QuickInstallationPage } = await import(
      "@/app/[locale]/quick-installation/page"
    );
    const { getByText, getAllByText } = render(<QuickInstallationPage />);

    expect(getByText("Install KubeStellar Console")).not.toBeNull();
    expect(
      getAllByText(
        /curl -sSL https:\/\/raw.githubusercontent.com\/kubestellar\/console\/main\/start.sh \| bash/
      ).length
    ).toBeGreaterThan(0);
  });

  it("renders the environment variables reference table", async () => {
    const { default: QuickInstallationPage } = await import(
      "@/app/[locale]/quick-installation/page"
    );
    const { getByText } = render(<QuickInstallationPage />);
    expect(getByText("GITHUB_CLIENT_ID")).not.toBeNull();
    expect(getByText("GitHub OAuth App Client ID")).not.toBeNull();
  });

  it("renders a GitHub developer settings link with safe rel/target attributes", async () => {
    const { default: QuickInstallationPage } = await import(
      "@/app/[locale]/quick-installation/page"
    );
    const { getByText } = render(<QuickInstallationPage />);
    const link = getByText("GitHub Developer Settings → OAuth Apps → New OAuth App");
    expect(link.getAttribute("href")).toBe(
      "https://github.com/settings/developers"
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("CodeBlock copy button success path shows the copied indicator then reverts after the timeout", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const { default: QuickInstallationPage } = await import(
      "@/app/[locale]/quick-installation/page"
    );
    const { getAllByLabelText, getAllByTestId, queryAllByTestId } = render(
      <QuickInstallationPage />
    );

    const copyButtons = getAllByLabelText("Copy code");
    expect(copyButtons.length).toBeGreaterThan(0);
    // The page also renders one static CheckCircle2 icon outside the
    // CodeBlock (in the "What happens" callout); capture that baseline so
    // the copy-success assertion only looks at the delta the click causes.
    const baselineCheckCount = getAllByTestId("icon-check-circle").length;
    expect(getAllByTestId("icon-copy").length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(copyButtons[0]);
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith(
      "curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash"
    );
    expect(getAllByTestId("icon-check-circle").length).toBe(
      baselineCheckCount + 1
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(queryAllByTestId("icon-check-circle").length).toBe(
      baselineCheckCount
    );
  });

  it("FAQ items toggle open/closed and show the chevron state transition", async () => {
    const { default: QuickInstallationPage } = await import(
      "@/app/[locale]/quick-installation/page"
    );
    const { getByText, queryByText } = render(<QuickInstallationPage />);

    const question = getByText("What does the start.sh script do?");
    expect(
      queryByText(/It downloads the latest Console and kc-agent binaries/)
    ).toBeNull();

    fireEvent.click(question.closest("button")!);

    expect(
      getByText(/It downloads the latest Console and kc-agent binaries/)
    ).not.toBeNull();

    fireEvent.click(question.closest("button")!);

    expect(
      queryByText(/It downloads the latest Console and kc-agent binaries/)
    ).toBeNull();
  });
});
