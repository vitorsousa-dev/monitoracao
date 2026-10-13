import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface LayoutContextType {
  sidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void
  mobileSidebarOpen: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleSidebarCollapsed = useCallback(() => setSidebarCollapsed((c) => !c), [])
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), [])
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), [])

  return (
    <LayoutContext.Provider
      value={{ sidebarCollapsed, toggleSidebarCollapsed, mobileSidebarOpen, openMobileSidebar, closeMobileSidebar }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}
