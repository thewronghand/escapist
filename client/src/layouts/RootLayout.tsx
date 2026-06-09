import { useState, useEffect } from 'react'
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { useAtom, useAtomValue } from 'jotai'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { SidebarShell } from '@/components/layout/SidebarShell'
import { LearnSidebar } from '@/components/learn/LearnSidebar'
import { SandboxPanel } from '@/components/sandbox/SandboxPanel'
import { sessionsQuery } from '@/stores/queries'
import { chatSessionIdAtom, learnViewAtom } from '@/stores/chat'
import { useChat } from '@/hooks/useChat'

const PATH_TO_NAV: Record<string, string> = {
  '/': 'dashboard', '/learn': 'learn', '/interview': 'interview',
  '/endless': 'endless', '/settings': 'settings',
}

const NAV_TO_PATH: Record<string, string> = {
  dashboard: '/', learn: '/learn', interview: '/interview',
  endless: '/endless', settings: '/settings',
}

export function RootLayout() {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeNav = PATH_TO_NAV[pathname] ?? 'dashboard'

  const { data: sessions = [] } = useQuery(sessionsQuery('learn'))
  const sessionId = useAtomValue(chatSessionIdAtom)
  const [, setLearnView] = useAtom(learnViewAtom)
  const chat = useChat()

  const handleNavigate = (nav: string) => {
    router.navigate({ to: NAV_TO_PATH[nav] ?? '/' })
  }

  const handleSelectSession = (id: string) => {
    chat.loadSession(id)
    setLearnView('session')
  }

  const learnSidebar = (
    <SidebarShell>
      <LearnSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={() => setLearnView('select')}
      />
    </SidebarShell>
  )

  // 사이드바 타이밍 — 라우트 전환 후 표시 (View Transitions와 동기화)
  const shouldShowSidebar = activeNav === 'learn' && pathname !== '/settings'
  const [showSidebar, setShowSidebar] = useState(shouldShowSidebar)

  useEffect(() => {
    if (shouldShowSidebar) {
      // 라우트 전환 애니메이션 후 사이드바 표시
      const timer = requestAnimationFrame(() => setShowSidebar(true))
      return () => cancelAnimationFrame(timer)
    } else {
      setShowSidebar(false)
    }
  }, [shouldShowSidebar])

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={handleNavigate}
      onSettings={() => router.navigate({ to: '/settings' })}
      sidebar={showSidebar ? learnSidebar : undefined}
    >
      <Outlet />
      <SandboxPanel />
    </AppShell>
  )
}
