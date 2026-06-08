import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { NavRail } from '@/components/layout/NavRail'

interface AppShellProps {
  activeNav: string
  onNavigate: (id: string) => void
  sidebar?: ReactNode
  children: ReactNode
}

export function AppShell({ activeNav, onNavigate, sidebar, children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-canvas text-body font-sans">
      <Header />
      <div className="flex flex-1 min-h-0">
        <NavRail active={activeNav} onNavigate={onNavigate} />
        {sidebar}
        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
