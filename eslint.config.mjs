import { createRequire } from "module";

const require = createRequire(import.meta.url);

// eslint-config-next 16.x exports flat config arrays natively.
// FlatCompat is NOT needed and causes "Converting circular structure to JSON"
// errors due to eslint-plugin-react self-references in its configs object.
const coreWebVitals = require("eslint-config-next/core-web-vitals");

export default [
  ...coreWebVitals,
  {
    // Suppress React Compiler rules introduced in Next.js 16 / react-hooks v6.
    // The codebase predates these strict rules; enable incrementally later.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
];
