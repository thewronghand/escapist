import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { NavRail } from '@/components/layout/NavRail'
import { BottomNav } from '@/components/layout/BottomNav'

interface AppShellProps {
  activeNav: string
  onNavigate: (id: string) => void
  onSettings?: () => void
  sidebar?: ReactNode
  children: ReactNode
}

export function AppShell({ activeNav, onNavigate, onSettings, sidebar, children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-canvas text-body font-sans">
      <Header onSettings={onSettings} />
      <div className="flex flex-1 min-h-0">
        {/* 데스크톱: 세로 NavRail */}
        <div className="hidden sm:block">
          <NavRail active={activeNav} onNavigate={onNavigate} />
        </div>
        {sidebar}
        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </div>
      {/* 모바일: 하단 탭바 */}
      <div className="sm:hidden">
        <BottomNav active={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
