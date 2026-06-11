import { Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { SandboxOverlay } from '@/components/sandbox/SandboxOverlay'

const PATH_TO_NAV: Record<string, string> = {
  '/': 'dashboard', '/learn': 'learn', '/interview': 'interview',
  '/endless': 'endless', '/sandbox': 'sandbox', '/settings': 'settings',
}

const NAV_TO_PATH: Record<string, string> = {
  dashboard: '/', learn: '/learn', interview: '/interview',
  endless: '/endless', sandbox: '/sandbox', settings: '/settings',
}

export function RootLayout() {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeNav = PATH_TO_NAV[pathname] ?? 'dashboard'
  const isSandboxPage = pathname === '/sandbox'

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
      {!isSandboxPage && (
        <SandboxOverlay onNavigateToPage={() => router.navigate({ to: '/sandbox' })} />
      )}
    </AppShell>
  )
}
