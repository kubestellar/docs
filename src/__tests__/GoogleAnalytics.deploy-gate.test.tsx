// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

/**
 * Unit tests for the production-deploy gate in
 * src/components/GoogleAnalytics.tsx.
 *
 * netlify.toml's `branch-deploy` context (every PR preview) builds with
 * NEXT_PUBLIC_BRANCH set to the source branch name via
 * `NEXT_PUBLIC_BRANCH=${BRANCH:-main}`. Only `main` and pinned
 * `docs/{version}` release branches should actually load gtag.js and fire
 * `gtag('config', ...)` — everything else must render nothing, so preview
 * traffic never reaches the production GA4 property.
 */

const originalBranch = process.env.NEXT_PUBLIC_BRANCH
const originalGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

async function loadModule() {
  return import('../components/GoogleAnalytics')
}

describe('isProductionDeploy — branch classification', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (originalBranch === undefined) delete process.env.NEXT_PUBLIC_BRANCH
    else process.env.NEXT_PUBLIC_BRANCH = originalBranch
  })

  it('is true on the main branch', async () => {
    process.env.NEXT_PUBLIC_BRANCH = 'main'
    const { isProductionDeploy } = await loadModule()
    expect(isProductionDeploy()).toBe(true)
  })

  it('is true on a pinned docs/{version} release branch', async () => {
    process.env.NEXT_PUBLIC_BRANCH = 'docs/0.29.0'
    const { isProductionDeploy } = await loadModule()
    expect(isProductionDeploy()).toBe(true)
  })

  it('is false for a PR preview / feature branch', async () => {
    process.env.NEXT_PUBLIC_BRANCH = 'fix-typo-in-readme'
    const { isProductionDeploy } = await loadModule()
    expect(isProductionDeploy()).toBe(false)
  })

  it('defaults to true (main) when NEXT_PUBLIC_BRANCH is unset', async () => {
    delete process.env.NEXT_PUBLIC_BRANCH
    const { isProductionDeploy } = await loadModule()
    expect(isProductionDeploy()).toBe(true)
  })
})

describe('GoogleAnalytics — render gate', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (originalBranch === undefined) delete process.env.NEXT_PUBLIC_BRANCH
    else process.env.NEXT_PUBLIC_BRANCH = originalBranch

    if (originalGaId === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalGaId
  })

  it('renders nothing for a PR preview / feature branch', async () => {
    process.env.NEXT_PUBLIC_BRANCH = 'fix-typo-in-readme'
    const { default: GoogleAnalytics } = await loadModule()
    const { container } = render(<GoogleAnalytics />)
    expect(container.firstChild).toBeNull()
  })
})
