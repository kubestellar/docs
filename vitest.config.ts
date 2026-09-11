import { defineConfig } from 'vitest/config'
import { transformWithEsbuild } from 'vite'
import type { SourceMapInput } from 'rollup'
import path from 'path'
import { CiObservabilityReporter } from './scripts/vitest-ci-observability-reporter'

export default defineConfig({
  plugins: [
    {
      // mdx-components.js contains JSX in a .js file. Next.js compiles it via
      // SWC, but vitest's esbuild pipeline only parses JSX in .jsx/.tsx files,
      // so tests that import the docs page (which imports mdx-components.js)
      // need this file transformed with the JSX loader.
      name: 'treat-mdx-components-js-as-jsx',
      async transform(code, id) {
        if (!id.endsWith('mdx-components.js')) return null
        const result = await transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' })
        return {
          code: result.code,
          // esbuild types sourcesContent as (string | null)[] while rollup
          // expects string[]; the payload is equivalent at runtime.
          map: result.map as unknown as SourceMapInput,
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    // 'default' keeps existing console output unchanged; CiObservabilityReporter
    // adds a bounded CI_OBSERVABILITY line + $GITHUB_STEP_SUMMARY table on top,
    // with no change to pass/fail semantics (see scripts/vitest-ci-observability-reporter.ts).
    reporters: ['default', new CiObservabilityReporter()],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.d.ts',
        // three.js scene wiring — cannot be meaningfully asserted in
        // JSDOM (no WebGL context, no requestAnimationFrame semantics).
        // colors.ts is intentionally NOT excluded — it is a pure export
        // and is already covered by src/__tests__/data-exports.test.ts.
        // See #6815 (step 3) for the analysis behind this exclusion.
        'src/components/animations/**/*.tsx',
      ],
      thresholds: {
        // Global floors — kept a couple of points below actual totals
        // (~40 L / 39 S / 29 F / 29 B on 2026-09-11) so day-to-day churn
        // doesn't false-fire while a broad regression still trips CI.
        lines: 38,
        statements: 37,
        functions: 27,
        branches: 27,
        // Per-glob floors ratchet in the paths that are actually
        // well-covered today. Without these, a file like src/lib/url.ts
        // could regress from 100% → 15% and the global gate would still
        // pass (the June 2026 unstyled-docs incident is the class of bug
        // this catches — see #6720). Floors are set 2–5 pp under observed
        // coverage per the summary in the same 2026-09-11 run.
        'src/lib/**': {
          lines: 97, statements: 97, functions: 95, branches: 95,
        },
        'src/config/**': {
          lines: 97, statements: 97, functions: 95, branches: 95,
        },
        'src/hooks/**': {
          lines: 90, statements: 90, functions: 90, branches: 90,
        },
        'src/i18n/**': {
          lines: 90, statements: 88, functions: 95, branches: 95,
        },
        'src/middleware.ts': {
          lines: 95, statements: 95, functions: 95, branches: 95,
        },
        'src/app/api/**': {
          lines: 95, statements: 95, functions: 95, branches: 90,
        },
        'src/app/sitemap.ts': {
          lines: 95, statements: 95, functions: 95, branches: 95,
        },
        'src/app/robots.ts': {
          lines: 95, statements: 95, functions: 95, branches: 0,
        },
        'src/components/navbar/**': {
          lines: 95, statements: 95, functions: 90, branches: 80,
        },
        'src/components/Footer.tsx': {
          lines: 95, statements: 95, functions: 95, branches: 95,
        },
        'src/components/NotFoundUI.tsx': {
          lines: 95, statements: 95, functions: 95, branches: 95,
        },
        'src/components/LanguageSwitcher.tsx': {
          lines: 90, statements: 90, functions: 90, branches: 85,
        },
        'src/components/GoogleAnalytics.tsx': {
          lines: 90, statements: 90, functions: 95, branches: 90,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
