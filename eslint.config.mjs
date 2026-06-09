// Native ESLint flat config using only top-level packages.
//
// eslint-plugin-react is nested inside eslint-config-next and is not
// importable directly. Only packages that are hoisted to the project root
// can be used: @next/eslint-plugin-next, @typescript-eslint/*, and
// eslint-plugin-react-hooks.
//
// eslint-config-next@16 dropped the FlatCompat route because
// @eslint/eslintrc's JSON-validator crashes on eslint-plugin-react@7.x's
// circular reference (configs.flat.recommended.plugins.react.configs → itself).

import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Next.js recommended rules + Core Web Vitals checks
  nextPlugin.flatConfig.recommended,
  nextPlugin.flatConfig.coreWebVitals,
  // TypeScript (includes parser, plugin, and recommended rules)
  ...tsPlugin.configs["flat/recommended"],
  // React hooks (rules-of-hooks, exhaustive-deps)
  reactHooks.configs["recommended-latest"],
  // Ensure TypeScript parser is used for .ts / .tsx files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
  },
];
