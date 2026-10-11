import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

/**
 * Coverage for src/app/[locale]/layout.tsx (kubestellar/docs quality finding).
 * This is the root layout wrapping every localized page: it previously
 * shipped with 0% unit coverage despite containing real logic
 * (generateMetadata's per-locale OpenGraph/Twitter metadata, and
 * RootLayout's notFound() guard for an unsupported locale param).
 * Next.js internals (fonts, next-intl, next-themes, GoogleAnalytics) are
 * mocked so only this file's own logic is exercised.
 */

// vitest's postcss pipeline can't resolve this repo's string-form
// @tailwindcss/postcss plugin reference (works fine under Next's own
// webpack/postcss loader, but not vite's) — mock the stylesheet import
// away so this file's actual logic can be tested in isolation.
vi.mock("../globals.css", () => ({}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono" }),
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
}));

const getTranslationsMock = vi.fn();
const getMessagesMock = vi.fn();
vi.mock("next-intl/server", () => ({
  getTranslations: (...args: unknown[]) => getTranslationsMock(...args),
  getMessages: () => getMessagesMock(),
}));

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/GoogleAnalytics", () => ({
  default: () => null,
}));

const { generateMetadata, default: RootLayout } = await import("../app/[locale]/layout");

describe("generateMetadata", () => {
  beforeEach(() => {
    getTranslationsMock.mockReset();
    getTranslationsMock.mockImplementation(async () => {
      const t = (key: string) =>
        ({ title: "KubeStellar", description: "Multi-cluster orchestration" })[key];
      return t;
    });
  });

  it("builds locale-specific metadata using en_US as the openGraph locale for en", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });

    expect(meta.title).toBe("KubeStellar");
    expect(meta.description).toBe("Multi-cluster orchestration");
    expect(meta.alternates?.canonical).toBe("/en");
    expect(meta.openGraph?.locale).toBe("en_US");
    expect(meta.openGraph?.url).toBe("https://kubestellar.io/en");
    expect(meta.twitter?.card).toBe("summary_large_image");
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("passes non-en locales through verbatim as the openGraph locale", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "fr" }) });

    expect(meta.openGraph?.locale).toBe("fr");
    expect(meta.alternates?.canonical).toBe("/fr");
  });
});

describe("RootLayout", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    getMessagesMock.mockReset();
    getMessagesMock.mockResolvedValue({ hello: "world" });
  });

  it("calls notFound() for a locale outside the supported list", async () => {
    await expect(
      RootLayout({ children: "child", params: Promise.resolve({ locale: "xx" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("renders the html/body wrapper with the requested locale and children for a supported locale", async () => {
    const element = await RootLayout({
      children: "hello-children",
      params: Promise.resolve({ locale: "fr" }),
    });

    expect(element.type).toBe("html");
    expect(element.props.lang).toBe("fr");
    expect(element.props.suppressHydrationWarning).toBe(true);

    const body = element.props.children;
    expect(body.type).toBe("body");
    expect(body.props.className).toContain("--font-inter");
    expect(body.props.className).toContain("--font-jetbrains-mono");

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(getMessagesMock).toHaveBeenCalledTimes(1);
  });
});
