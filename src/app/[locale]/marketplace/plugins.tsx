// Re-export shim: the marketplace plugin data was split into focused
// modules under `./plugins/` (see ./plugins/index.tsx and ./plugins/data/*).
// This file is kept so existing imports of `./plugins` keep working.
export * from "./plugins/index";
