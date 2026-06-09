import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { SidebarShell } from '@/components/layout/SidebarShell'
import { LearnSidebar } from '@/components/learn/LearnSidebar'
import { SandboxPanel } from '@/components/sandbox/SandboxPanel'
import { DashboardPage } from '@/pages/DashboardPage'
import { LearnPage } from '@/pages/LearnPage'
import { InterviewPage } from '@/pages/InterviewPage'
import { EndlessPage } from '@/pages/EndlessPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AppProvider, useAppContext } from '@/contexts/AppContext'

const PATH_TO_NAV: Record<string, string> = {
  '/': 'dashboard', '/learn': 'learn', '/interview': 'interview',
  '/endless': 'endless', '/settings': 'settings',
}

const NAV_TO_PATH: Record<string, string> = {
  dashboard: '/', learn: '/learn', interview: '/interview',
  endless: '/endless', settings: '/settings',
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chat, sessions, learnView, setLearnView } = useAppContext()

  const activeNav = PATH_TO_NAV[location.pathname] ?? 'dashboard'
  const isSettings = location.pathname === '/settings'

  const handleNavigate = (nav: string) => {
    navigate(NAV_TO_PATH[nav] ?? '/')
  }

  const handleSelectSession = (id: string) => {
    chat.loadSession(id)
    setLearnView('session')
  }

  const learnSidebar = (
    <SidebarShell>
      <LearnSidebar
        sessions={sessions.sessions}
        activeSessionId={chat.sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={() => setLearnView('select')}
      />
    </SidebarShell>
  )

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={handleNavigate}
      onSettings={() => navigate('/settings')}
      sidebar={!isSettings && activeNav === 'learn' ? learnSidebar : undefined}
    >
      <Routes>
        <Route path="/" element={<DashboardPage onNavigate={handleNavigate} />} />
        <Route path="/learn" element={
          <LearnPage
            chat={chat}
            sessions={sessions.sessions}
            view={learnView}
            setView={setLearnView}
            onSessionCreated={sessions.refresh}
          />
        } />
        <Route path="/interview" element={<InterviewPage onNavigate={handleNavigate} />} />
        <Route path="/endless" element={<EndlessPage onNavigate={handleNavigate} />} />
        <Route path="/settings" element={<SettingsPage onBack={() => navigate(-1)} />} />
      </Routes>
      <SandboxPanel />
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
