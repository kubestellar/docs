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
