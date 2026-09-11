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
        lines: 33,
        functions: 22,
        branches: 22,
        statements: 32,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
