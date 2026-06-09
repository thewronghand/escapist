import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SidebarShell } from '@/components/layout/SidebarShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { LearnPage } from '@/pages/LearnPage'
import { InterviewPage } from '@/pages/InterviewPage'
import { EndlessPage } from '@/pages/EndlessPage'
import { SandboxPanel } from '@/components/sandbox/SandboxPanel'
// import { BackgroundShapes } from '@/components/layout/BackgroundShapes'
import { LearnSidebar } from '@/components/learn/LearnSidebar'
import { useSessions } from '@/hooks/useSessions'
import { useChat } from '@/hooks/useChat'

function App() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const sessions = useSessions('learn')
  const chat = useChat()
  const [learnView, setLearnView] = useState<'select' | 'session'>('select')

  const handleSelectSession = (id: string) => {
    chat.loadSession(id)
    setLearnView('session')
  }

  const handleNewSession = () => {
    setLearnView('select')
  }

  const learnSidebar = (
    <SidebarShell>
      <LearnSidebar
        sessions={sessions.sessions}
        activeSessionId={chat.sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />
    </SidebarShell>
  )

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={setActiveNav}
      sidebar={activeNav === 'learn' ? learnSidebar : undefined}
    >
      {activeNav === 'dashboard' && <DashboardPage onNavigate={setActiveNav} />}
      {activeNav === 'learn' && (
        <LearnPage
          chat={chat}
          sessions={sessions.sessions}
          view={learnView}
          setView={setLearnView}
          onSessionCreated={sessions.refresh}
        />
      )}
      {activeNav === 'interview' && <InterviewPage onNavigate={setActiveNav} />}
      {activeNav === 'endless' && <EndlessPage onNavigate={setActiveNav} />}
      <SandboxPanel />
    </AppShell>
  )
}

export default App
