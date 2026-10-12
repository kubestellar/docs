// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";

/**
 * Coverage for src/app/[locale]/not-found.tsx and src/app/not-found.tsx
 * (kubestellar/docs quality finding). Both files had 0% unit AND e2e
 * coverage: the Playwright smoke suite only visits known-good routes, never
 * a 404. Each page is a thin wrapper that must render NotFoundUI — the
 * deliberately Tailwind-free, self-contained 404 component used during
 * deploy-propagation windows (see NotFoundUI.tsx's own doc comment). We
 * mock NotFoundUI so these tests only cover each page's own wiring.
 */

vi.mock("@/components/NotFoundUI", () => ({
  default: () => <div data-testid="not-found-ui" />,
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="intl-provider">{children}</div>
  ),
}));

const getLocaleMock = vi.fn(async () => "en");
const getMessagesMock = vi.fn(async () => ({}));
vi.mock("next-intl/server", () => ({
  getLocale: () => getLocaleMock(),
  getMessages: () => getMessagesMock(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("src/app/[locale]/not-found.tsx", () => {
  it("renders NotFoundUI directly, with no Navbar/Footer/locale provider", async () => {
    const { default: LocaleNotFound } = await import(
      "../app/[locale]/not-found"
    );

    render(<LocaleNotFound />);

    expect(screen.getByTestId("not-found-ui")).toBeTruthy();
    expect(screen.queryByTestId("intl-provider")).toBeNull();
  });
});

describe("src/app/not-found.tsx", () => {
  it("wraps NotFoundUI in a NextIntlClientProvider using the resolved locale/messages", async () => {
    const { default: RootNotFound } = await import("../app/not-found");

    const ui = await RootNotFound();
    render(ui);

    expect(getLocaleMock).toHaveBeenCalledTimes(1);
    expect(getMessagesMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("intl-provider")).toBeTruthy();
    expect(screen.getByTestId("not-found-ui")).toBeTruthy();
  });
});
