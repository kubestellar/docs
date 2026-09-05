import { defineConfig } from 'vitest/config'
import { transformWithEsbuild } from 'vite'
import path from 'path'

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
        return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' })
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.d.ts'],
      thresholds: {
        // Global floor stays low: many presentation components (Navbar,
        // Footer, master-page sections, animation globes) have 0% coverage
        // by design and dominate the project-wide %. Regression protection
        // is delivered by the per-glob floors below, which lock in what is
        // actually tested today so a drop in those paths fails CI even
        // when the global % barely moves.
        lines: 12,
        functions: 7,
        branches: 7,
        statements: 12,
        // Per-directory ratchets. Values sit ~2–5 pts below observed %
        // (vitest run --coverage on main) so routine churn doesn't false-fire.
        'src/lib/**': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
        'src/hooks/**': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        'src/i18n/**': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        'src/config/**': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
        'src/app/docs/[...slug]/page-map.ts': {
          lines: 85,
          functions: 85,
          branches: 75,
          statements: 85,
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
