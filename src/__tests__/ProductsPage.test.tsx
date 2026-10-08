// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/products/page.tsx (baseline 0%, kubestellar/docs#7214).
 *
 * ProductsPage is a "use client" page with a local, data-driven `products`
 * array plus a `selectedProduct` state/modal pattern: clicking the "Watch
 * Demo" button (rendered only when `hasDemo` is true) opens a video modal
 * gated on `selectedProduct?.demoVideo`, and clicking the close button or
 * the backdrop clears it again.
 *
 * PageShell, next-intl, and next/image are mocked so this test exercises
 * only ProductsPage's own markup/state logic, matching the pattern used by
 * src/__tests__/ProgramPageClient.render.test.tsx.
 */

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    React.createElement("img", { alt, src }),
}));

vi.mock("@/components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));

afterEach(() => {
  cleanup();
});

describe("ProductsPage", () => {
  it("renders the hero title/subtitle and every product entry from the local data array", async () => {
    const { default: ProductsPage } = await import(
      "@/app/[locale]/products/page"
    );
    const { getByText, getAllByText, queryByText } = render(<ProductsPage />);

    expect(getByText("productsPage.title")).not.toBeNull();
    expect(getByText("productsPage.subtitle")).not.toBeNull();

    expect(getByText("productsPage.products.console.fullName")).not.toBeNull();
    expect(getByText("productsPage.products.kubeflex.fullName")).not.toBeNull();
    expect(getByText("productsPage.products.a2a.fullName")).not.toBeNull();
    expect(
      getByText("productsPage.products.kubectlMulti.fullName")
    ).not.toBeNull();
    // The "kubestellar" product intentionally hides its own title heading
    // (full-width logo only — see the `product.id !== "kubestellar"` guard).
    expect(
      queryByText("productsPage.products.kubestellar.fullName")
    ).toBeNull();
    expect(getAllByText("productsPage.repoButton").length).toBe(7);
  });

  it("links the repository button to each product's GitHub repository", async () => {
    const { default: ProductsPage } = await import(
      "@/app/[locale]/products/page"
    );
    const { getAllByText } = render(<ProductsPage />);
    const repoLinks = getAllByText("productsPage.repoButton").map(
      el => el.closest("a")!
    );
    expect(repoLinks[0].getAttribute("href")).toBe(
      "https://github.com/kubestellar/console"
    );
    expect(repoLinks[0].getAttribute("target")).toBe("_blank");
    expect(repoLinks[0].getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders a website/watch-demo link for every non-demo-button product without hasDemo", async () => {
    const { default: ProductsPage } = await import(
      "@/app/[locale]/products/page"
    );
    const { getAllByText } = render(<ProductsPage />);
    // Only kubectl-multi has hasDemo: true (a real <button>) out of 7
    // products. kubestellar-ui and galaxy-marketplace show the
    // "watchDemoButton" label on their website <a> instead of "websiteButton"
    // (see the id-based branch in the !hasDemo anchor), so the remaining
    // 4 products (console, kubestellar, kubeflex, a2a) show "websiteButton".
    expect(getAllByText("productsPage.websiteButton").length).toBe(4);
    const watchDemoLabelled = getAllByText("productsPage.watchDemoButton");
    expect(watchDemoLabelled.length).toBe(3);
    const realDemoButtons = watchDemoLabelled.filter(
      el => el.closest("button") !== null
    );
    expect(realDemoButtons.length).toBe(1);
  });

  it("opens the demo video modal when the Watch Demo button is clicked, and closes it via the close button", async () => {
    const { default: ProductsPage } = await import(
      "@/app/[locale]/products/page"
    );
    const { getByText, getAllByText, queryByText, container } = render(
      <ProductsPage />
    );

    const watchDemoButton = getAllByText("productsPage.watchDemoButton").find(
      el => el.closest("button") !== null
    )!;
    expect(watchDemoButton.closest("button")).not.toBeNull();
    fireEvent.click(watchDemoButton.closest("button")!);

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toBe(
      "https://www.youtube.com/embed/YtocfNSKqgI?si=SJc798MuZ2o9LeP_"
    );
    expect(getByText(/kubectlMulti.fullName Demo/)).not.toBeNull();

    const closeButton = container.querySelector(
      "button.absolute.top-4.right-4"
    );
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton!);

    expect(container.querySelector("iframe")).toBeNull();
    expect(queryByText(/kubectlMulti.fullName Demo/)).toBeNull();
  });

  it("closes the demo video modal when the backdrop is clicked", async () => {
    const { default: ProductsPage } = await import(
      "@/app/[locale]/products/page"
    );
    const { getAllByText, container } = render(<ProductsPage />);

    const watchDemoButton = getAllByText("productsPage.watchDemoButton").find(
      el => el.closest("button") !== null
    )!;
    fireEvent.click(watchDemoButton.closest("button")!);
    expect(container.querySelector("iframe")).not.toBeNull();

    const backdrop = container.querySelector(".fixed.inset-0.z-50");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);

    expect(container.querySelector("iframe")).toBeNull();
  });
});
