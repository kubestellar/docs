import { getRequestConfig } from "next-intl/server";
import { locales, type Locale, defaultLocale } from "./settings";
import { logger } from "@/lib/logger";
import { recordLocaleFallback } from "@/lib/metrics";

const isLocale = (val: string): val is Locale =>
  (locales as readonly string[]).includes(val);

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = defaultLocale;
  }

  const defaultMessages = (await import(`../../messages/${defaultLocale}.json`))
    .default;

  if (locale === defaultLocale) {
    return { locale, messages: defaultMessages };
  }

  let localeMessages;
  try {
    localeMessages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    // Unlike src/lib/metrics.ts's docs_api_* metrics (scoped to /api/*
    // route handlers), this fires during SSR page rendering for any
    // locale whose bundled messages/<locale>.json fails to import. Both
    // the structured log and the bounded docs_i18n_locale_fallback_total
    // counter (locale label is restricted to the fixed Locale union, see
    // src/i18n/settings.ts) make an otherwise-silent fallback visible —
    // previously this only reached a bare console.warn with no metric.
    logger.error("i18n locale bundle failed to load", {
      route: "i18n-locale-fallback",
      error: error instanceof Error ? error.message : String(error),
      filePath: `messages/${locale}.json`,
    });
    // Safe: `locale` is either the already-validated `isLocale(locale)` result
    // above, or returned early as `defaultLocale` — never reaches here as a
    // plain unvalidated string.
    recordLocaleFallback(locale as Locale);
    return { locale, messages: defaultMessages };
  }

  const mergedMessages = deepMerge(defaultMessages, localeMessages);

  return {
    locale,
    messages: mergedMessages,
  };
});
