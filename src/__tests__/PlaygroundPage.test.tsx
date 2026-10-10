// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/playground/page.tsx.
 * The page renders a Loader and redirects to /coming-soon on mount.
 */

const mockReplace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/components/animations/Loader", () => ({
  default: () => React.createElement("div", { "data-testid": "loader" }),
}));

import PlaygroundPage from "../app/[locale]/playground/page";

afterEach(() => {
  cleanup();
  mockReplace.mockClear();
});

describe("PlaygroundPage", () => {
  it("renders the Loader", () => {
    const { getByTestId } = render(<PlaygroundPage />);
    expect(getByTestId("loader")).toBeTruthy();
  });

  it("redirects to /coming-soon on mount", () => {
    render(<PlaygroundPage />);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/coming-soon");
  });
});
