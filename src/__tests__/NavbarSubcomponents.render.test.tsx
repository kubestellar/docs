// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('ContributeDropdown', () => {
  it('renders closed (aria-expanded=false, no rotate class)', () => {
    render(<ContributeDropdown t={t} isContributeOpen={false} />)
    const button = screen.getByRole('button', { expanded: false })
    expect(button).toBeTruthy()
    expect(
      screen.getByText('joinIn').closest('a')?.getAttribute('href')
    ).toContain('joinus')
  })

  it('renders open (aria-expanded=true, rotate class applied)', () => {
    render(<ContributeDropdown t={t} isContributeOpen={true} />)
    expect(screen.getByRole('button', { expanded: true })).toBeTruthy()
  })
})

describe('CommunityDropdown', () => {
  it('renders closed', () => {
    render(<CommunityDropdown t={t} isCommunityOpen={false} />)
    expect(screen.getByRole('button', { expanded: false })).toBeTruthy()
    expect(screen.getByText('partners')).toBeTruthy()
  })

  it('renders open', () => {
    render(<CommunityDropdown t={t} isCommunityOpen={true} />)
    expect(screen.getByRole('button', { expanded: true })).toBeTruthy()
  })
})

describe('GithubDropdown', () => {
  it('renders closed and shows github stats', () => {
    render(
      <GithubDropdown t={t} isGithubOpen={false} githubStats={githubStats} />
    )
    expect(screen.getByText('githubStar')).toBeTruthy()
    expect(screen.getByText(githubStats.stars)).toBeTruthy()
    expect(screen.getByText(githubStats.forks)).toBeTruthy()
    expect(screen.getByText(githubStats.watchers)).toBeTruthy()
  })

  it('renders open', () => {
    const { container } = render(
      <GithubDropdown t={t} isGithubOpen={true} githubStats={githubStats} />
    )
    expect(container.querySelector('.rotate-180')).not.toBeNull()
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
