import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { NavRail } from '@/components/layout/NavRail'
import { BottomNav } from '@/components/layout/BottomNav'

interface AppShellProps {
  activeNav: string
  onNavigate: (id: string) => void
  onSettings?: () => void
  children: ReactNode
}

export function AppShell({ activeNav, onNavigate, onSettings, children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-canvas text-body font-sans">
      <Header onSettings={onSettings} />
      <div className="flex flex-1 min-h-0">
        <div className="hidden sm:block">
          <NavRail active={activeNav} onNavigate={onNavigate} />
        </div>
        <main className="flex-1 min-h-0 overflow-auto" style={{ viewTransitionName: 'content' }}>
          {children}
        </main>
      </div>
      <div className="sm:hidden">
        <BottomNav active={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
