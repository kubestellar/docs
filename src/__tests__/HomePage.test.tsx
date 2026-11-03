// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

/**
 * Coverage for src/app/[locale]/page.tsx (the site home page), at 0%
 * baseline. It only composes the master-page sections plus the shared
 * Navbar/Footer, so each child is stubbed and this just asserts Home
 * renders all of them, in order, inside <main>.
 */

vi.mock("@/components/master-page/HeroSection", () => ({
  default: () => React.createElement("div", { "data-testid": "hero-section" }),
}));
vi.mock("@/components/master-page/AboutSection", () => ({
  default: () => React.createElement("div", { "data-testid": "about-section" }),
}));
vi.mock("@/components/master-page/UseCasesSection", () => ({
  default: () => React.createElement("div", { "data-testid": "use-cases-section" }),
}));
vi.mock("@/components/master-page/ContactSection", () => ({
  default: () => React.createElement("div", { "data-testid": "contact-section" }),
}));
vi.mock("@/components", () => ({
  Navbar: () => React.createElement("div", { "data-testid": "navbar" }),
  Footer: () => React.createElement("div", { "data-testid": "footer" }),
}));

afterEach(() => {
  cleanup();
});

describe("Home (/[locale])", () => {
  it("renders the navbar, every master-page section, and the footer inside <main>", async () => {
    const { default: Home } = await import("@/app/[locale]/page");
    const { container, getByTestId } = render(<Home />);

    const main = container.querySelector("main");
    expect(main).not.toBeNull();

    for (const testId of [
      "navbar",
      "hero-section",
      "about-section",
      "use-cases-section",
      "contact-section",
      "footer",
    ]) {
      expect(getByTestId(testId)).not.toBeNull();
    }

    const order = Array.from(main!.children).map((el) =>
      el.getAttribute("data-testid")
    );
    expect(order).toEqual([
      "navbar",
      "hero-section",
      "about-section",
      "use-cases-section",
      "contact-section",
      "footer",
    ]);
  });
});
