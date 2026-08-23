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
});
