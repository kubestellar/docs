import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use FlatCompat with only next/core-web-vitals (which already includes
// next/typescript). Extending both "next/core-web-vitals" AND "next/typescript"
// causes eslint-plugin-react to be registered twice, crashing with
// "ConfigError: Cannot redefine plugin 'react'".
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals"),
];
