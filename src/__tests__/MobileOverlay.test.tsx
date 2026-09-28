// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

import { DocsProvider, useDocsMenu } from '@/components/docs/DocsProvider'
import { MobileOverlay } from '@/components/docs/MobileOverlay'

/**
 * Coverage for src/components/docs/MobileOverlay.tsx (baseline 0%).
 *
 * MobileOverlay is a tiny <div> that:
 *   - returns null when menuOpen is false (the default DocsProvider state)
 *   - renders a full-screen click-target when menuOpen is true
 *   - calls toggleMenu() (which flips menuOpen back to false) on click
 *
 * These three arms cover every statement/branch in the file.
 */

function OpenMenu() {
  const { setMenuOpen } = useDocsMenu()
  React.useEffect(() => {
    setMenuOpen(true)
  }, [setMenuOpen])
  return null
}

function MenuState({ onState }: { onState: (open: boolean) => void }) {
  const { menuOpen } = useDocsMenu()
  React.useEffect(() => {
    onState(menuOpen)
  }, [menuOpen, onState])
  return null
}

describe('MobileOverlay', () => {
  afterEach(() => cleanup())

  it('renders nothing when the mobile menu is closed', () => {
    const { container } = render(
      <DocsProvider>
        <MobileOverlay />
      </DocsProvider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the click-target overlay when the mobile menu is open', () => {
    const { container } = render(
      <DocsProvider>
        <OpenMenu />
        <MobileOverlay />
      </DocsProvider>,
    )
    const overlay = container.querySelector('div')
    expect(overlay).not.toBeNull()
    expect(overlay!.className).toContain('fixed')
    expect(overlay!.className).toContain('inset-0')
    expect(overlay!.className).toContain('lg:hidden')
  })

  it('invokes toggleMenu (closes the menu) when clicked', () => {
    const states: boolean[] = []
    const { container } = render(
      <DocsProvider>
        <OpenMenu />
        <MenuState onState={(s) => states.push(s)} />
        <MobileOverlay />
      </DocsProvider>,
    )
    const overlay = container.querySelector('div')!
    fireEvent.click(overlay)
    // Last observed state must be `false` — click flipped the menu back off.
    expect(states[states.length - 1]).toBe(false)
  })
})

