import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { RootLayout } from '@/layouts/RootLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LearnPageWrapper } from '@/pages/LearnPageWrapper'
import { InterviewPage } from '@/pages/InterviewPage'
import { EndlessPage } from '@/pages/EndlessPage'
import { SettingsPageWrapper } from '@/pages/SettingsPageWrapper'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardWrapper,
})

const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learn',
  component: LearnPageWrapper,
})

const interviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/interview',
  component: InterviewWrapper,
})

const endlessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/endless',
  component: EndlessWrapper,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPageWrapper,
})

// 래퍼 컴포넌트 — props를 hooks/atoms에서 가져와서 전달
import { useRouter } from '@tanstack/react-router'

function DashboardWrapper() {
  const router = useRouter()
  return <DashboardPage onNavigate={(nav: string) => {
    const map: Record<string, string> = { dashboard: '/', learn: '/learn', interview: '/interview', endless: '/endless' }
    router.navigate({ to: map[nav] ?? '/' })
  }} />
}

function InterviewWrapper() {
  const router = useRouter()
  return <InterviewPage onNavigate={(nav: string) => {
    const map: Record<string, string> = { dashboard: '/', learn: '/learn', interview: '/interview', endless: '/endless' }
    router.navigate({ to: map[nav] ?? '/' })
  }} />
}

function EndlessWrapper() {
  const router = useRouter()
  return <EndlessPage onNavigate={(nav: string) => {
    const map: Record<string, string> = { dashboard: '/', learn: '/learn', interview: '/interview', endless: '/endless' }
    router.navigate({ to: map[nav] ?? '/' })
  }} />
}

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  learnRoute,
  interviewRoute,
  endlessRoute,
  settingsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
