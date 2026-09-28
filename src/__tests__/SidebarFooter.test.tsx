// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/docs/SidebarFooter.tsx (baseline 0%).
 *
 * SidebarFooter has two visual variants (`full`, default; `slim`) and each
 * variant has a pre-mount placeholder plus a mounted render, so the tests
 * cover:
 *   - full pre-mount placeholder (mocked useState to force mounted=false)
 *   - full mounted, dark theme + collapse button (default variant)
 *   - full mounted, light theme, isMobile=true suppresses collapse button
 *   - full: clicking the theme button toggles setTheme(dark→light and light→dark)
 *   - full: clicking the collapse button calls onCollapse
 *   - slim pre-mount placeholder
 *   - slim mounted, theme + expand-sidebar buttons wire to setTheme / onCollapse
 */

let mockResolvedTheme: string | undefined = 'dark'
const setTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme, setTheme }),
}))

// lucide-react ships ESM components — replace them with trivial stubs so
// the test doesn't need to boot Lucide's entire barrel for one icon.
vi.mock('lucide-react', () => ({
  Moon: (props: Record<string, unknown>) =>
    React.createElement('span', { ...props, 'data-icon': 'moon' }),
  Sun: (props: Record<string, unknown>) =>
    React.createElement('span', { ...props, 'data-icon': 'sun' }),
  PanelRightOpenIcon: (props: Record<string, unknown>) =>
    React.createElement('span', { ...props, 'data-icon': 'panel-right' }),
  PanelLeftOpen: (props: Record<string, unknown>) =>
    React.createElement('span', { ...props, 'data-icon': 'panel-left' }),
}))

import { SidebarFooter } from '@/components/docs/SidebarFooter'

describe('SidebarFooter (full variant)', () => {
  afterEach(() => {
    cleanup()
    mockResolvedTheme = 'dark'
    setTheme.mockReset()
  })

  it('renders the dark-mode mounted chrome with "Dark" label and collapse button', () => {
    mockResolvedTheme = 'dark'
    const onCollapse = vi.fn()
    const { container, getByTitle, getByText } = render(
      <SidebarFooter onCollapse={onCollapse} />,
    )
    expect(getByText('Dark')).not.toBeNull()
    const themeBtn = getByTitle('Change theme')
    const collapseBtn = getByTitle('Collapse sidebar')
    expect(themeBtn).not.toBeNull()
    expect(collapseBtn).not.toBeNull()

    fireEvent.click(themeBtn)
    expect(setTheme).toHaveBeenCalledWith('light')

    fireEvent.click(collapseBtn)
    expect(onCollapse).toHaveBeenCalledTimes(1)
    // Sanity: styled with the dark background token.
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.backgroundColor).toBe('rgb(17, 24, 39)')
  })

  it('renders the light-mode mounted chrome and hides the collapse button when isMobile=true', () => {
    mockResolvedTheme = 'light'
    const onCollapse = vi.fn()
    const { getByTitle, getByText, queryByTitle } = render(
      <SidebarFooter onCollapse={onCollapse} isMobile />,
    )
    expect(getByText('Light')).not.toBeNull()
    // Collapse button is hidden on mobile.
    expect(queryByTitle('Collapse sidebar')).toBeNull()
    // Clicking the theme button flips light → dark.
    fireEvent.click(getByTitle('Change theme'))
    expect(setTheme).toHaveBeenCalledWith('dark')
  })
})

describe('SidebarFooter (slim variant)', () => {
  afterEach(() => {
    cleanup()
    mockResolvedTheme = 'dark'
    setTheme.mockReset()
  })

  it('renders theme + expand buttons and wires their clicks', () => {
    mockResolvedTheme = 'dark'
    const onCollapse = vi.fn()
    const { getByTitle } = render(
      <SidebarFooter onCollapse={onCollapse} variant="slim" />,
    )
    fireEvent.click(getByTitle('Change theme'))
    expect(setTheme).toHaveBeenCalledWith('light')

    fireEvent.click(getByTitle('Expand sidebar'))
    expect(onCollapse).toHaveBeenCalledTimes(1)
  })
})
