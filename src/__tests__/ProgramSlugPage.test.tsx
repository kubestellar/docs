// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

/**
 * Coverage for src/app/[locale]/programs/[slug]/page.tsx.
 * Server component: resolves the slug, calls notFound() for unknown
 * programs, otherwise renders ProgramPageClient with the program.
 */

const mockGetProgramById = vi.fn();
vi.mock("../app/[locale]/programs/programs", () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));

const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

vi.mock("../app/[locale]/programs/[slug]/ProgramPageClient", () => ({
  default: () => null,
}));

import ProgramPage from "../app/[locale]/programs/[slug]/page";
import ProgramPageClient from "../app/[locale]/programs/[slug]/ProgramPageClient";

beforeEach(() => {
  mockGetProgramById.mockReset();
  mockNotFound.mockClear();
});

describe("ProgramPage", () => {
  it("renders ProgramPageClient with the resolved program", async () => {
    const program = { id: "gsoc" };
    mockGetProgramById.mockReturnValue(program);
    const el = (await ProgramPage({
      params: Promise.resolve({ slug: "gsoc" }),
    })) as React.ReactElement<{ program: unknown }>;
    expect(mockGetProgramById).toHaveBeenCalledWith("gsoc");
    expect(el.type).toBe(ProgramPageClient);
    expect(el.props.program).toBe(program);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("calls notFound() for an unknown slug", async () => {
    mockGetProgramById.mockReturnValue(undefined);
    await expect(
      ProgramPage({ params: Promise.resolve({ slug: "nope" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
