// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { usePlugins, plugins } from "../app/[locale]/marketplace/plugins";

/**
 * Coverage for src/app/[locale]/marketplace/plugins/index.tsx (kubestellar/docs).
 *
 * usePlugins() aggregates 25 individually-authored plugin factories into the
 * marketplace catalog. It had 0% unit coverage: every consumer test mocks
 * `usePlugins` directly (see marketplace-slug-page.test.tsx), so none of them
 * actually exercise this aggregation or catch a malformed/duplicated entry.
 */

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("usePlugins", () => {
  it("returns the full marketplace catalog with no duplicate ids or slugs", () => {
    const { result } = renderHook(() => usePlugins());
    const plugins = result.current;

    expect(plugins.length).toBe(25);

    const ids = plugins.map((p) => p.id);
    const slugs = plugins.map((p) => p.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("produces plugins with all required Plugin fields populated", () => {
    const { result } = renderHook(() => usePlugins());

    for (const plugin of result.current) {
      expect(plugin.name).toBeTruthy();
      expect(plugin.slug).toBeTruthy();
      expect(plugin.tagline).toBeTruthy();
      expect(plugin.description).toBeTruthy();
      expect(plugin.longDescription).toBeTruthy();
      expect(["free", "monthly", "one-time"]).toContain(plugin.pricing.type);
      expect(Array.isArray(plugin.features)).toBe(true);
      expect(plugin.features.length).toBeGreaterThan(0);
      expect(Array.isArray(plugin.requirements)).toBe(true);
      expect(Array.isArray(plugin.compatibility)).toBe(true);
      expect(Array.isArray(plugin.tags)).toBe(true);
    }
  });

  it("produces a non-empty category for every plugin via the injected translator", () => {
    const { result } = renderHook(() => usePlugins());

    for (const plugin of result.current) {
      expect(typeof plugin.category).toBe("string");
      expect(plugin.category.length).toBeGreaterThan(0);
    }
  });

  it("re-computes the catalog on every call (not module-level singletons)", () => {
    const { result: first } = renderHook(() => usePlugins());
    const { result: second } = renderHook(() => usePlugins());

    expect(first.current).not.toBe(second.current);
    expect(first.current.map((p) => p.id)).toEqual(
      second.current.map((p) => p.id),
    );
  });

  it("keeps the backward-compatible static export empty", () => {
    // index.tsx documents `plugins` as a backward-compat shim. Guard the
    // documented contract so a future refactor can't silently repopulate it
    // for a different purpose.
    expect(plugins).toEqual([]);
  });
});
