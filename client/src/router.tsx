import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { RootLayout } from '@/layouts/RootLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LearnPageWrapper } from '@/pages/LearnPageWrapper'
import { InterviewPage } from '@/pages/InterviewPage'
import { EndlessPage } from '@/pages/EndlessPage'
import { SandboxPage } from '@/pages/SandboxPage'
import { SettingsPageWrapper } from '@/pages/SettingsPageWrapper'

const NAV_MAP: Record<string, string> = {
  dashboard: '/', learn: '/learn', interview: '/interview',
  endless: '/endless', sandbox: '/sandbox',
}

const rootRoute = createRootRoute({
  component: RootLayout,
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

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardWrapper }),
  createRoute({ getParentRoute: () => rootRoute, path: '/learn', component: LearnPageWrapper }),
  createRoute({ getParentRoute: () => rootRoute, path: '/interview', component: InterviewWrapper }),
  createRoute({ getParentRoute: () => rootRoute, path: '/endless', component: EndlessWrapper }),
  createRoute({ getParentRoute: () => rootRoute, path: '/sandbox', component: SandboxPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPageWrapper }),
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
