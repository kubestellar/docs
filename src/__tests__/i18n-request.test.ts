import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getRequestConfig: (callback: unknown) => callback,
}));

const { default: requestConfig } = await import("../i18n/request");

describe("i18n request config", () => {
  it("falls back to the default locale when requestLocale is undefined", async () => {
    const result = await requestConfig({
      requestLocale: Promise.resolve(undefined),
    });

    expect(result.locale).toBe("en");
    expect(result.messages).toBeDefined();
  });
  it("falls back to the default locale for an unknown locale", async () => {
    const result = await requestConfig({
      requestLocale: Promise.resolve("klingon"),
    });
    expect(result.locale).toBe("en");
    expect(result.messages).toBeDefined();
  });
  it("returns default messages directly for the default locale", async () => {
    const result = await requestConfig({
      requestLocale: Promise.resolve("en"),
    });

    expect(result.locale).toBe("en");
    expect(result.messages).toBeDefined();
  });
  it("merges Spanish messages over the default messages", async () => {
    const en = (await import("../../messages/en.json")).default;

    const result = await requestConfig({
      requestLocale: Promise.resolve("es"),
    });

    expect(result.locale).toBe("es");
    expect(result.messages.heroSection.line1).not.toBe(en.heroSection.line1);

    for (const key of Object.keys(en)) {
      expect(result.messages[key]).toBeDefined();
    }
  });
  it("does not mutate the default messages when merging a locale", async () => {
    const en = (await import("../../messages/en.json")).default;

    const before = structuredClone(en);

    await requestConfig({
      requestLocale: Promise.resolve("es"),
    });

    expect(en).toEqual(before);
  });
  it("falls back to default messages when the locale bundle cannot be loaded", async () => {
    vi.resetModules();

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.doMock("../../messages/es.json", () => {
      throw new Error("Failed to load Spanish messages");
    });

    const { default: requestConfig } = await import("../i18n/request");

    const result = await requestConfig({
      requestLocale: Promise.resolve("es"),
    });

    expect(result.locale).toBe("es");
    expect(result.messages).toBeDefined();

    expect(warn).toHaveBeenCalledWith(
      "Could not load messages for locale: es. Falling back to 'en'."
    );

    warn.mockRestore();
  });

  it("deep-merges a locale-only nested key into an empty branch (target[key] || {} fallback)", async () => {
    // deepMerge on request.ts:19 has `(target[key] as Record<string, unknown>) || {}`.
    // The `|| {}` fallback fires when a locale bundle introduces a NESTED key
    // that has no counterpart in the default bundle — target[key] is
    // undefined, and recursion still needs a valid target object. If that
    // fallback were dropped, the recursion would call
    // `Object.keys(undefined)` and throw at request time, silently
    // breaking any locale that later adds a new nested translation
    // group ahead of its addition to `en.json`.
    vi.resetModules();

    vi.doMock("../../messages/es.json", () => ({
      default: {
        // A brand-new nested key that does NOT exist in en.json.
        __quality_only_in_es__: {
          nested: "es-only-value",
          deeper: { leaf: "deep-leaf" },
        },
      },
    }));

    const { default: requestConfig } = await import("../i18n/request");

    const result = await requestConfig({
      requestLocale: Promise.resolve("es"),
    });

    expect(result.locale).toBe("es");
    // The es-only nested tree survived the merge — proving the
    // `|| {}` fallback was hit and the recursion into an empty target
    // object completed.
    expect(result.messages.__quality_only_in_es__).toEqual({
      nested: "es-only-value",
      deeper: { leaf: "deep-leaf" },
    });
    // And the default-locale keys are still present (merge didn't
    // clobber the target).
    const en = (await import("../../messages/en.json")).default;
    for (const key of Object.keys(en)) {
      expect(result.messages[key]).toBeDefined();
    }
  });
});
