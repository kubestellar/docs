// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import HiveMovedPage, { metadata } from '../app/docs/hive/page'

// The /docs/hive route is a static "we moved" landing page. The Hive
// documentation has permanently relocated to docs.hivecommons.dev; this
// page exists only to catch inbound traffic to the old URL and point it
// at the new one. These tests lock the invariants that keep that
// redirection useful:
//
//   1. The metadata declares robots: { index: false } so search engines
//      stop indexing the old URL and surface the new one instead.
//   2. The visible primary call-to-action links to the new Hive docs
//      URL on docs.hivecommons.dev. If this ever regresses, visitors
//      arriving on the stale URL get stranded with no obvious next step.
//
// This file is covered by src/app/docs/hive in vitest.config.ts's
// coverage.include glob (`src/**/*.{ts,tsx}`), so the test closes a
// 0%-coverage gap flagged by `npx vitest run --coverage`.

describe('docs/hive moved page', () => {
  it('declares noindex metadata so search engines stop indexing the moved URL', () => {
    expect(metadata.title).toBe('Looking for Hive?')
    expect(typeof metadata.description).toBe('string')
    expect(metadata.description).toMatch(/docs\.hivecommons\.dev/)

    // Canonical must point at the stable /docs/hive path, not the new
    // destination — otherwise the redirect messaging on this page would
    // self-cannibalize the "moved" signal.
    expect(metadata.alternates?.canonical).toBe('/docs/hive')

    // robots.index MUST be false (follow may be true). The whole point
    // of this page is to drop out of the index without 404ing.
    const robots = metadata.robots
    expect(robots).toBeTruthy()
    expect(typeof robots).toBe('object')
    expect((robots as { index: boolean }).index).toBe(false)
  })

  it('renders the moved heading and links the CTA to docs.hivecommons.dev', () => {
    const { container, getByRole } = render(<HiveMovedPage />)

    const heading = getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('Looking for Hive?')

    const anchors = Array.from(container.querySelectorAll('a')) as HTMLAnchorElement[]
    expect(anchors.length).toBeGreaterThan(0)

    const hiveDocsLinks = anchors.filter(a =>
      a.getAttribute('href') === 'https://docs.hivecommons.dev/docs/hive/overview/introduction'
    )
    expect(hiveDocsLinks.length).toBe(1)
    const cta = hiveDocsLinks[0]
    expect(cta.textContent).toMatch(/Take me to the Hive docs/)

    // The project-home footer link points at the Hive Commons root.
    const projectHome = anchors.find(
      a => a.getAttribute('href') === 'https://hive.hivecommons.dev'
    )
    expect(projectHome).toBeDefined()
    expect(projectHome?.textContent).toMatch(/hive\.hivecommons\.dev/)
  })
})
