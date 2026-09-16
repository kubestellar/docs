import { useTranslations } from "next-intl";

/**
 * Type of the translator returned by `useTranslations("marketplace")`,
 * used by each per-plugin data factory to resolve category labels.
 */
export type Translator = ReturnType<typeof useTranslations>;
