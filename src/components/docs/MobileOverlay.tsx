'use client'

import { useDocsMenu } from './DocsProvider'

export function MobileOverlay() {
  const { menuOpen, toggleMenu } = useDocsMenu()

  if (!menuOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-20 lg:hidden"
      onClick={toggleMenu}
    />
  )
}
