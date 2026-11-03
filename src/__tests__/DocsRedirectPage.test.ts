// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

/**
 * Coverage for src/app/docs/page.tsx, at 0% baseline. The route exists only
 * to send visitors at the bare /docs path to the canonical introduction
 * page; this asserts it calls next/navigation's redirect() with that target
 * instead of rendering anything itself.
 */

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

describe("DocsPage (/docs)", () => {
  it("redirects to /docs/introduction", async () => {
    const { default: DocsPage } = await import("@/app/docs/page");
    DocsPage();
    expect(redirectMock).toHaveBeenCalledWith("/docs/introduction");
    expect(redirectMock).toHaveBeenCalledTimes(1);
  });
});
