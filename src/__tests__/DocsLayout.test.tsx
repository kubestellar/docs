import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

/**
 * Coverage for src/app/docs/layout.tsx (kubestellar/docs quality finding).
 * Same root cause as LocaleLayout.test.tsx: this file imports
 * "../globals.css", which vitest/vite 8 can't transform through this
 * repo's string-form `@tailwindcss/postcss` postcss.config.mjs entry. It
 * previously had 0% unit coverage. Child components are mocked so only
 * this layout's own static metadata/composition is exercised.
 */

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono" }),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/docs/DocsProvider", () => ({
  DocsProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/docs/MobileOverlay", () => ({
  MobileOverlay: () => null,
}));

vi.mock("@/components/docs/index", () => ({
  DocsNavbar: () => null,
  DocsFooter: () => null,
  DocsBanner: () => null,
}));

const { default: DocsLayout, metadata } = await import("../app/docs/layout");

describe("docs layout metadata", () => {
  it("carries the KubeStellar Docs title, description and canonical path", () => {
    expect(metadata.title).toEqual({
      default: "KubeStellar Docs - Multi-Cluster Kubernetes Orchestration",
      template: "%s | KubeStellar Docs",
    });
    expect(metadata.alternates?.canonical).toBe("/docs");
    expect(metadata.openGraph?.url).toBe("https://kubestellar.io/docs");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});

describe("DocsLayout", () => {
  it("renders the html/body wrapper with font variables and the children slot", async () => {
    const element = await DocsLayout({ children: "docs-children" });

    expect(element.type).toBe("html");
    expect(element.props.lang).toBe("en");
    expect(element.props.suppressHydrationWarning).toBe(true);

    const body = element.props.children;
    expect(body.type).toBe("body");
    expect(body.props.className).toContain("--font-inter");
    expect(body.props.className).toContain("--font-jetbrains-mono");
  });
});
