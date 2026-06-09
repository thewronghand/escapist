import { useAtom } from 'jotai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LearnPage } from '@/pages/LearnPage'
import { useChat } from '@/hooks/useChat'
import { sessionsQuery } from '@/stores/queries'
import { learnViewAtom } from '@/stores/chat'

export function LearnPageWrapper() {
  const chat = useChat()
  const { data: sessions = [] } = useQuery(sessionsQuery('learn'))
  const [learnView, setLearnView] = useAtom(learnViewAtom)
  const queryClient = useQueryClient()

  return (
    <LearnPage
      chat={chat}
      sessions={sessions}
      view={learnView}
      setView={setLearnView}
      onSessionCreated={() => queryClient.invalidateQueries({ queryKey: ['sessions'] })}
    />
  )
}
