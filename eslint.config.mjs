// Native flat ESLint config — avoids FlatCompat + @eslint/eslintrc's
// JSON.stringify-based config validator, which crashes on the circular
// reference in eslint-plugin-react@7.x (configs.flat.recommended.plugins.react).
//
// All plugins used here ship native flat-config exports; FlatCompat is
// intentionally not used.

import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  // React rules (flat config — does not go through @eslint/eslintrc validator)
  {
    ...react.configs.flat.recommended,
    settings: { react: { version: "detect" } },
  },
  // Disable react/react-in-jsx-scope for React 17+ JSX transform
  react.configs.flat["jsx-runtime"],
  // React hooks
  reactHooks.configs["recommended-latest"],
  // Next.js recommended + Core Web Vitals
  nextPlugin.flatConfig.recommended,
  nextPlugin.flatConfig.coreWebVitals,
  // TypeScript (flat/recommended already sets @typescript-eslint/parser)
  ...tsPlugin.configs["flat/recommended"],
  // TypeScript parser override for tsx/ts files not covered above
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
  },
];
