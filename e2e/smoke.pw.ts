import { test, expect } from '@playwright/test'

const ROUTES = [
  '/',
  '/docs',
  '/docs/console/acmm-dashboard',
  '/docs/hive',
  '/marketplace',
  '/leaderboard',
  '/acmm-leaderboard',
  '/programs',
  '/programs/gsoc',
  '/products',
  '/partners',
  '/playground',
  '/ladder',
  '/quick-installation',
  '/contribute-handbook',
  '/coming-soon',
  '/coming-soon-marketplace',
]

for (const route of ROUTES) {
  test(`${route} renders without page errors`, async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    const response = await page.goto(route)
    expect(response?.status(), `status for ${route}`).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('main, #__next, body').first()).not.toBeEmpty()

    expect(pageErrors).toEqual([])
  })
}

test('homepage has a title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/.+/)
})
