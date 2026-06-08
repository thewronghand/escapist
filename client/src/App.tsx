import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { LearnPage } from '@/pages/LearnPage'
import { InterviewPage } from '@/pages/InterviewPage'
import { EndlessPage } from '@/pages/EndlessPage'
import { SandboxPanel } from '@/components/sandbox/SandboxPanel'

function App() {
  const [activeNav, setActiveNav] = useState('dashboard')

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={setActiveNav}
    >
      {activeNav === 'dashboard' && <DashboardPage />}
      {activeNav === 'learn' && <LearnPage />}
      {activeNav === 'interview' && <InterviewPage />}
      {activeNav === 'endless' && <EndlessPage />}
      <SandboxPanel />
    </AppShell>
  )
}

export default App
