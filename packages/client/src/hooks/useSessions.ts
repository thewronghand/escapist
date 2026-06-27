import { trpc } from '@/lib/trpc'

export function useSessions(mode = 'learn') {
  const { data: sessions = [], isLoading: loading, refetch } = trpc.sessions.list.useQuery({ mode })

  return { sessions, loading, refresh: () => { void refetch() } }
}
