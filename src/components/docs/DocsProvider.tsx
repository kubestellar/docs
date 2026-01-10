'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface DocsContextType {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  toggleMenu: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const DocsContext = createContext<DocsContextType | undefined>(undefined)

export function DocsProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev)

  return (
    <DocsContext.Provider value={{ 
      menuOpen, 
      setMenuOpen, 
      toggleMenu,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar
    }}>
      {children}
    </DocsContext.Provider>
  )
}

export function useDocsMenu() {
  const context = useContext(DocsContext)
  if (context === undefined) {
    throw new Error('useDocsMenu must be used within a DocsProvider')
  }
  return context
}
