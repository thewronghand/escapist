import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { LearnPage } from '@/pages/LearnPage'
import { useChat } from '@/hooks/useChat'
import { trpc } from '@/lib/trpc'
import { learnViewAtom } from '@/stores/chat'

export function LearnPageWrapper() {
  const chat = useChat()
  const { data: sessions = [] } = trpc.sessions.list.useQuery({ mode: 'learn' })
  const [learnView, setLearnView] = useAtom(learnViewAtom)
  const utils = trpc.useUtils()

  // 학습 탭 진입 시 세션이 없으면 select로 리셋
  useEffect(() => {
    if (learnView === 'session' && !chat.sessionId && chat.messages.length === 0) {
      setLearnView('select')
    }
  }, [])

  return (
    <LearnPage
      chat={chat}
      sessions={sessions}
      view={learnView}
      setView={setLearnView}
      onSessionCreated={() => { void utils.sessions.list.invalidate() }}
    />
  )
}
