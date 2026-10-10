import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3000)
const baseURL = `http://localhost:${PORT}`

// Specs use the *.pw.ts suffix so vitest's default glob never picks them up.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // e2e.yml invokes `npm run test:e2e` directly, so the bounded
  // CI_OBSERVABILITY summary (see scripts/playwright-ci-observability-reporter.ts,
  // mirroring vitest.config.ts's reporter for the vitest suite) is wired in
  // here rather than via a wrapping CI script.
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['./scripts/playwright-ci-observability-reporter.ts']]
    : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
