// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/master-page/UseCasesSection.tsx (baseline 0%).
 *
 * UseCasesSection is a "use client" component with flip-card interactivity:
 *   1. flipped state to track which card is flipped
 *   2. handleFlip to toggle the flipped state by index
 *   3. getIcon() helper that returns SVG icons based on type (globe, security, cloud, etc)
 *   4. Renders 6 use-case cards with front (icon + title + description) and back
 *      (title + description + features + decorative line) faces
 *   5. onMouseEnter/onMouseLeave trigger flip animation on desktop
 * Structural render exercises all card rendering + icon helper branches.
 *
 * See #6815 (step 2) for the residual master-page render-smoke work item.
 */

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `t.${key}`,
}))

vi.mock('@/components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))
vi.mock('../components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))

afterEach(() => {
  cleanup()
})

describe('UseCasesSection render', () => {
  it('renders without throwing and mounts the section root', async () => {
    const mod = await import('../components/master-page/UseCasesSection')
    const UseCasesSection = mod.default
    const { container } = render(<UseCasesSection />)
    const section = container.querySelector('section#use-cases')
    expect(section).not.toBeNull()
  })

  it('mounts the StarField and GridLines background decorations', async () => {
    const mod = await import('../components/master-page/UseCasesSection')
    const UseCasesSection = mod.default
    const { getByTestId } = render(<UseCasesSection />)
    expect(getByTestId('starfield')).not.toBeNull()
    expect(getByTestId('gridlines')).not.toBeNull()
  })

  it('renders section heading and subtitle', async () => {
    const mod = await import('../components/master-page/UseCasesSection')
    const UseCasesSection = mod.default
    const { container } = render(<UseCasesSection />)
    const headings = container.querySelectorAll('h2')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders all 6 use-case cards', async () => {
    const mod = await import('../components/master-page/UseCasesSection')
    const UseCasesSection = mod.default
    const { container } = render(<UseCasesSection />)
    const cards = container.querySelectorAll('[style*="preserve-3d"]')
    expect(cards.length).toBe(6)
  })

  it('renders icons for each card (getIcon helper exercise)', async () => {
    const mod = await import('../components/master-page/UseCasesSection')
    const UseCasesSection = mod.default
    const { container } = render(<UseCasesSection />)
    const svgs = container.querySelectorAll('svg')
    // Each card has at least one icon (glob, security, power, clock, cloud, network)
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('card flip state toggles on mouse enter/leave', async () => {
    const mod = await import('../components/master-page/UseCasesSection')
    const UseCasesSection = mod.default
    const { container } = render(<UseCasesSection />)
    const cards = container.querySelectorAll('[style*="preserve-3d"]')
    const firstCard = cards[0] as HTMLElement

    // Initial state should be rotateY(0deg)
    expect(firstCard.style.transform).toBe('rotateY(0deg)')

    // Mouse enter should flip
    fireEvent.mouseEnter(firstCard)
    // After event, the component updates its style
    expect(firstCard.style.transform).toBe('rotateY(180deg)')

    // Mouse leave should reset
    fireEvent.mouseLeave(firstCard)
    expect(firstCard.style.transform).toBe('rotateY(0deg)')
  })

  it('renders back-face content (title, description, features)', async () => {
    const mod = await import('../components/master-page/UseCasesSection')
    const UseCasesSection = mod.default
    const { container } = render(<UseCasesSection />)
    // Back faces have feature lists with dots (divs with gradient background)
    const featureDots = container.querySelectorAll('.bg-gradient-to-r')
    expect(featureDots.length).toBeGreaterThan(0)
  })
})
