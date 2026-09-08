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
        lines: 12,
        functions: 7,
        branches: 7,
        statements: 12,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
