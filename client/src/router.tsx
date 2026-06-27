import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { RootLayout } from '@/layouts/RootLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LearnPageWrapper } from '@/pages/LearnPageWrapper'
import { InterviewPage } from '@/pages/InterviewPage'
import { EndlessPage } from '@/pages/EndlessPage'
import { SandboxPage } from '@/pages/SandboxPage'
import { SettingsPageWrapper } from '@/pages/SettingsPageWrapper'
import { LoginPage } from '@/pages/LoginPage'
import { useAuth } from '@/hooks/useAuth'

const NAV_MAP: Record<string, string> = {
  dashboard: '/', learn: '/learn', interview: '/interview',
  endless: '/endless', sandbox: '/sandbox',
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas text-muted">로딩 중...</div>
  }

  if (!isAuthenticated) {
    router.navigate({ to: '/login' })
    return null
  }

  return <RootLayout />
}

const rootRoute = createRootRoute({
  component: Outlet,
})

function DashboardWrapper() {
  const router = useRouter()
  return <DashboardPage onNavigate={(nav: string) => router.navigate({ to: NAV_MAP[nav] ?? '/' })} />
}

function InterviewWrapper() {
  const router = useRouter()
  return <InterviewPage onNavigate={(nav: string) => router.navigate({ to: NAV_MAP[nav] ?? '/' })} />
}

function EndlessWrapper() {
  const router = useRouter()
  return <EndlessPage onNavigate={(nav: string) => router.navigate({ to: NAV_MAP[nav] ?? '/' })} />
}

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })

const appRoute = createRoute({ getParentRoute: () => rootRoute, id: 'app', component: AuthGate })

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    createRoute({ getParentRoute: () => appRoute, path: '/', component: DashboardWrapper }),
    createRoute({ getParentRoute: () => appRoute, path: '/learn', component: LearnPageWrapper }),
    createRoute({ getParentRoute: () => appRoute, path: '/interview', component: InterviewWrapper }),
    createRoute({ getParentRoute: () => appRoute, path: '/endless', component: EndlessWrapper }),
    createRoute({ getParentRoute: () => appRoute, path: '/sandbox', component: SandboxPage }),
    createRoute({ getParentRoute: () => appRoute, path: '/settings', component: SettingsPageWrapper }),
  ]),
])

export const router = createRouter({
  routeTree,
  defaultViewTransition: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
