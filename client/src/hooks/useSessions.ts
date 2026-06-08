import { useState, useEffect, useCallback } from 'react'
import type { SessionSummary } from '@/types'
import { send, subscribe } from '@/lib/ws'

export function useSessions(mode = 'learn') {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = subscribe((data) => {
      if (data.type === 'session:list') {
        setSessions(data.sessions as SessionSummary[])
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const refresh = useCallback(() => {
    setLoading(true)
    send({ type: 'session:list', message: mode })
  }, [mode])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { sessions, loading, refresh }
}
