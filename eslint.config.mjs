import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// eslint-plugin-react@7.x has a circular reference:
//   configs.flat.recommended.plugins.react.configs → itself
// @eslint/eslintrc's config validator crashes on JSON.stringify of this.
// Fix: extend each shareable config separately, build a shared plugin registry
// (so all configs reference the same plugin object), and strip the circular
// `configs` key before registering.

/** Shared plugin instances, keyed by plugin name. Built from first occurrence. */
const pluginRegistry = new Map();

function registerPlugins(configs) {
  for (const config of configs) {
    for (const [name, plugin] of Object.entries(config.plugins ?? {})) {
      if (!pluginRegistry.has(name)) {
        pluginRegistry.set(name, { ...plugin, configs: undefined });
      }
    }
  }
}

/** Replace each config's plugins with the shared, non-circular instances. */
function dedupePlugins(configs) {
  return configs.map((config) => {
    if (!config.plugins) return config;
    return {
      ...config,
      plugins: Object.fromEntries(
        Object.keys(config.plugins).map((name) => [
          name,
          pluginRegistry.get(name),
        ])
      ),
    };
  });
}

const webVitalsConfig = compat.extends("next/core-web-vitals");
const tsConfig = compat.extends("next/typescript");

registerPlugins(webVitalsConfig);
registerPlugins(tsConfig);

export default [...dedupePlugins(webVitalsConfig), ...dedupePlugins(tsConfig)];

