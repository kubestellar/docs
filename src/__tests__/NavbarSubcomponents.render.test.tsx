// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

/**
 * Render coverage for the src/components/navbar/** sub-components extracted
 * from Navbar.tsx in #6971 (docs#6975). These files shipped with no tests,
 * dropping src/components/navbar/** below its configured coverage
 * thresholds (95/95/90/80 lines/statements/functions/branches).
 *
 * Each component only takes plain props (translation fn + booleans/stats),
 * so plain RTL renders without extra mocking are enough to exercise the
 * open/closed branches and hit every exported function.
 */

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...rest}>
      {children}
    </a>
  ),
}))

const t = ((key: string) => key) as unknown as Parameters<
  typeof import('../components/navbar/NavbarLogo').default
>[0]['t']

const githubStats = { stars: '30', forks: '25', watchers: '1' }
const noop = () => {}

import NavbarLogo from '../components/navbar/NavbarLogo'
import ContributeDropdown from '../components/navbar/ContributeDropdown'
import CommunityDropdown from '../components/navbar/CommunityDropdown'
import GithubDropdown from '../components/navbar/GithubDropdown'
import MobileMenu from '../components/navbar/MobileMenu'

describe('NavbarLogo', () => {
  it('renders the logo link and nested children', () => {
    render(
      <NavbarLogo t={t}>
        <span data-testid="child">dropdowns</span>
      </NavbarLogo>
    )
    expect(screen.getByText('docs')).toBeTruthy()
    expect(screen.getByText('liveDemo')).toBeTruthy()
    expect(screen.getByText('marketplace')).toBeTruthy()
    expect(screen.getByTestId('child')).toBeTruthy()
  })

  it('renders without children', () => {
    render(<NavbarLogo t={t} />)
    expect(screen.getByText('docs')).toBeTruthy()
  })
})

/**
 * Shared contract for the three hover dropdowns (docs#7095): the menu's
 * `hidden` attribute and the trigger's `aria-expanded` derive from the same
 * `isOpen` prop, and hover wires straight to `onOpen` / `onClose`.
 */
function dropdownContract(
  name: string,
  renderWith: (props: {
    isOpen: boolean
    onOpen: () => void
    onClose: () => void
  }) => ReturnType<typeof render>,
  opts: { hasAriaExpanded: boolean }
) {
  describe(name, () => {
    it('renders closed: menu hidden, chevron not rotated', () => {
      const { container } = renderWith({ isOpen: false, onOpen: noop, onClose: noop })
      const menu = container.querySelector('[data-dropdown-menu]')
      expect(menu).not.toBeNull()
      expect(menu!.hasAttribute('hidden')).toBe(true)
      expect(container.querySelector('.rotate-180')).toBeNull()
      if (opts.hasAriaExpanded) {
        expect(screen.getByRole('button', { expanded: false })).toBeTruthy()
      }
    })

    it('renders open: menu visible, chevron rotated', () => {
      const { container } = renderWith({ isOpen: true, onOpen: noop, onClose: noop })
      const menu = container.querySelector('[data-dropdown-menu]')
      expect(menu!.hasAttribute('hidden')).toBe(false)
      expect(container.querySelector('.rotate-180')).not.toBeNull()
      if (opts.hasAriaExpanded) {
        expect(screen.getByRole('button', { expanded: true })).toBeTruthy()
      }
    })

    it('never renders an inline display style (visibility is declarative)', () => {
      const { container } = renderWith({ isOpen: true, onOpen: noop, onClose: noop })
      const menu = container.querySelector<HTMLElement>('[data-dropdown-menu]')
      expect(menu!.style.display).toBe('')
    })

    it('calls onOpen on mouseenter and onClose on mouseleave of the container', () => {
      const onOpen = vi.fn()
      const onClose = vi.fn()
      const { container } = renderWith({ isOpen: false, onOpen, onClose })
      const root = container.querySelector('[data-dropdown]')!
      fireEvent.mouseEnter(root)
      expect(onOpen).toHaveBeenCalledTimes(1)
      expect(onClose).not.toHaveBeenCalled()
      fireEvent.mouseLeave(root)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
}

dropdownContract(
  'ContributeDropdown',
  props => render(<ContributeDropdown t={t} {...props} />),
  { hasAriaExpanded: true }
)

dropdownContract(
  'CommunityDropdown',
  props => render(<CommunityDropdown t={t} {...props} />),
  { hasAriaExpanded: true }
)

dropdownContract(
  'GithubDropdown',
  props => render(<GithubDropdown t={t} githubStats={githubStats} {...props} />),
  { hasAriaExpanded: false }
)

describe('dropdown content', () => {
  it('ContributeDropdown links to joinus', () => {
    render(<ContributeDropdown t={t} isOpen={false} onOpen={noop} onClose={noop} />)
    expect(
      screen.getByText('joinIn').closest('a')?.getAttribute('href')
    ).toContain('joinus')
  })

  it('CommunityDropdown lists partners', () => {
    render(<CommunityDropdown t={t} isOpen={false} onOpen={noop} onClose={noop} />)
    expect(screen.getByText('partners')).toBeTruthy()
  })

  it('GithubDropdown shows github stats', () => {
    render(
      <GithubDropdown t={t} isOpen={false} onOpen={noop} onClose={noop} githubStats={githubStats} />
    )
    expect(screen.getByText('githubStar')).toBeTruthy()
    expect(screen.getByText(githubStats.stars)).toBeTruthy()
    expect(screen.getByText(githubStats.forks)).toBeTruthy()
    expect(screen.getByText(githubStats.watchers)).toBeTruthy()
  })
})

describe('MobileMenu', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <MobileMenu isMenuOpen={false} t={t} githubStats={githubStats} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders the panel with github stats when open', () => {
    render(<MobileMenu isMenuOpen={true} t={t} githubStats={githubStats} />)
    expect(screen.getByText(githubStats.stars)).toBeTruthy()
    expect(screen.getByText(githubStats.forks)).toBeTruthy()
    expect(screen.getByText(githubStats.watchers)).toBeTruthy()
  })
})

describe('navbar index exports', () => {
  it('re-exports the hooks and components used by Navbar.tsx', async () => {
    const mod = await import('../components/navbar/index')
    expect(Object.keys(mod).sort()).toEqual(
      [
        'useGithubStats',
        'useNavDropdowns',
        'NavbarLogo',
        'ContributeDropdown',
        'CommunityDropdown',
        'GithubDropdown',
        'MobileMenu',
        'MobileTopLinks',
        'MobileContributeSection',
        'MobileCommunitySection',
        'MobileGithubSection',
      ].sort()
    )
  })
})
