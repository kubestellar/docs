// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent, screen, act } from "@testing-library/react";

import PluginDetailPage from "../app/[locale]/marketplace/[slug]/page";

/**
 * Coverage for src/app/[locale]/marketplace/[slug]/page.tsx (kubestellar/docs#7297).
 * Child sections/modals are mocked so only the page's own state machine is tested.
 */

const state = vi.hoisted(() => ({
  slug: "free-one",
  plugins: [] as Array<{ slug: string; name: string; pricing: { type: string } }>,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: state.slug }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));
vi.mock("@/components", () => ({
  Navbar: () => React.createElement("nav", { "data-testid": "navbar" }),
  Footer: () => React.createElement("footer", { "data-testid": "footer" }),
}));
vi.mock("../app/[locale]/marketplace/plugins", () => ({
  usePlugins: () => state.plugins,
}));
vi.mock("../app/[locale]/marketplace/[slug]/components/PluginDetailSections", () => ({
  PluginDetailSections: ({ plugin, onInstall }: { plugin: { name: string }; onInstall: () => void }) =>
    React.createElement("button", { onClick: onInstall }, `install ${plugin.name}`),
}));
vi.mock("../app/[locale]/marketplace/[slug]/components/PluginInstallModal", () => ({
  PluginInstallModal: ({ installedSuccess, onClose }: { installedSuccess: boolean; onClose: () => void }) =>
    React.createElement(
      "div",
      { "data-testid": "install-modal", "data-success": String(installedSuccess) },
      React.createElement("button", { onClick: onClose }, "close-install"),
    ),
}));
vi.mock("../app/[locale]/marketplace/[slug]/components/PluginPaymentModal", () => ({
  PluginPaymentModal: ({
    paymentSuccess,
    isProcessing,
    onClose,
    onPayment,
  }: {
    paymentSuccess: boolean;
    isProcessing: boolean;
    onClose: () => void;
    onPayment: () => void;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "payment-modal",
        "data-success": String(paymentSuccess),
        "data-processing": String(isProcessing),
      },
      React.createElement("button", { onClick: onPayment }, "pay"),
      React.createElement("button", { onClick: onClose }, "close-payment"),
    ),
}));

describe("PluginDetailPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.slug = "free-one";
    state.plugins = [
      { slug: "free-one", name: "Free One", pricing: { type: "free" } },
      { slug: "paid-one", name: "Paid One", pricing: { type: "one-time" } },
    ];
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders not-found state with back link when slug is unknown", () => {
    state.slug = "nope";
    render(<PluginDetailPage />);
    expect(screen.getByText("plugin.notFound.title")).toBeTruthy();
    expect(screen.getByText(/plugin.backToMarketplace/).closest("a")?.getAttribute("href")).toBe(
      "/marketplace",
    );
    expect(screen.queryByTestId("navbar")).toBeNull();
  });

  it("renders navbar, details and footer for a known plugin", () => {
    render(<PluginDetailPage />);
    expect(screen.getByTestId("navbar")).toBeTruthy();
    expect(screen.getByTestId("footer")).toBeTruthy();
    expect(screen.getByText("install Free One")).toBeTruthy();
    expect(screen.queryByTestId("install-modal")).toBeNull();
    expect(screen.queryByTestId("payment-modal")).toBeNull();
  });

  it("free install opens install modal and flags success after 2s; close resets", () => {
    render(<PluginDetailPage />);
    fireEvent.click(screen.getByText("install Free One"));
    expect(screen.queryByTestId("payment-modal")).toBeNull();
    expect(screen.getByTestId("install-modal").getAttribute("data-success")).toBe("false");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("install-modal").getAttribute("data-success")).toBe("true");
    fireEvent.click(screen.getByText("close-install"));
    expect(screen.queryByTestId("install-modal")).toBeNull();
  });

  it("paid install opens payment modal and runs the full payment flow", () => {
    state.slug = "paid-one";
    render(<PluginDetailPage />);
    fireEvent.click(screen.getByText("install Paid One"));
    expect(screen.getByTestId("payment-modal")).toBeTruthy();
    expect(screen.queryByTestId("install-modal")).toBeNull();

    fireEvent.click(screen.getByText("pay"));
    expect(screen.getByTestId("payment-modal").getAttribute("data-processing")).toBe("true");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    const modal = screen.getByTestId("payment-modal");
    expect(modal.getAttribute("data-success")).toBe("true");
    expect(modal.getAttribute("data-processing")).toBe("false");

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByTestId("payment-modal")).toBeNull();
    expect(screen.getByTestId("install-modal").getAttribute("data-success")).toBe("false");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("install-modal").getAttribute("data-success")).toBe("true");
  });

  it("closing payment modal hides it", () => {
    state.slug = "paid-one";
    render(<PluginDetailPage />);
    fireEvent.click(screen.getByText("install Paid One"));
    fireEvent.click(screen.getByText("close-payment"));
    expect(screen.queryByTestId("payment-modal")).toBeNull();
  });
});
