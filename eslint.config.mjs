import { createRequire } from "module";

const require = createRequire(import.meta.url);

// eslint-config-next 16.x exports flat config arrays natively.
// FlatCompat is NOT needed and causes "Converting circular structure to JSON"
// errors due to eslint-plugin-react self-references in its configs object.
const coreWebVitals = require("eslint-config-next/core-web-vitals");

export default [...coreWebVitals];
