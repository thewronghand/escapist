import { Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { SandboxPanel } from '@/components/sandbox/SandboxPanel'

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

  const handleNavigate = (nav: string) => {
    router.navigate({ to: NAV_TO_PATH[nav] ?? '/' })
  }

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={handleNavigate}
      onSettings={() => router.navigate({ to: '/settings' })}
    >
      <Outlet />
      <SandboxPanel />
    </AppShell>
  )
}
