import { createContext, useContext, useState, type ReactNode } from 'react'
import { useChat } from '@/hooks/useChat'
import { useSessions } from '@/hooks/useSessions'

interface AppContextValue {
  chat: ReturnType<typeof useChat>
  sessions: ReturnType<typeof useSessions>
  learnView: 'select' | 'session'
  setLearnView: (v: 'select' | 'session') => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const chat = useChat()
  const sessions = useSessions('learn')
  const [learnView, setLearnView] = useState<'select' | 'session'>('select')

  return (
    <AppContext value={{ chat, sessions, learnView, setLearnView }}>
      {children}
    </AppContext>
  )
}
