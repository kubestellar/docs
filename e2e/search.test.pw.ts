import { test, expect } from '@playwright/test'

// Exercises the Cmd/Ctrl+K search command palette end to end: it has rich
// unit coverage (SearchCommandPalette.render.test.tsx, useDocsSearch.ts
// tests, src/__tests__/search-route*.test.ts) but no browser-level test
// previously verified the open → query → results → navigate flow actually
// works together against the real /api/search route and router.
test('search command palette finds a result and navigates to it', async ({ page }) => {
  await page.goto('/docs')

  const openButton = page.getByRole('button', { name: 'Search documentation' }).first()
  await openButton.click()

  const searchInput = page.getByPlaceholder('Search documentation...')
  await expect(searchInput).toBeVisible()
  await expect(searchInput).toBeFocused()

  await searchInput.fill('kubestellar')

  const resultLink = page.locator('a', { hasText: /.+/ }).filter({
    has: page.locator('div.font-medium'),
  }).first()
  await expect(resultLink).toBeVisible({ timeout: 10_000 })

  const href = await resultLink.getAttribute('href')
  expect(href).toBeTruthy()

  await resultLink.click()
  await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

  // The palette should close once a result is selected.
  await expect(page.getByPlaceholder('Search documentation...')).toBeHidden()
})

test('search command palette closes on Escape without navigating', async ({ page }) => {
  // Note: /docs server-redirects to /docs/introduction (src/app/docs/page.tsx),
  // so start from the resolved URL to assert the palette itself doesn't navigate.
  await page.goto('/docs/introduction')

  await page.getByRole('button', { name: 'Search documentation' }).first().click()
  const searchInput = page.getByPlaceholder('Search documentation...')
  await expect(searchInput).toBeVisible()

  await searchInput.fill('cluster')
  await page.keyboard.press('Escape')

  await expect(searchInput).toBeHidden()
  await expect(page).toHaveURL(/\/docs\/introduction$/)
})
