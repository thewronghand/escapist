import { useState, useEffect, useCallback } from 'react'
import type { SessionSummary } from '@/types'

export function useSessions(mode = 'learn') {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions?mode=${mode}`)
      if (res.ok) {
        const data = await res.json() as SessionSummary[]
        setSessions(data)
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => { refresh() }, [refresh])

  return { sessions, loading, refresh }
}
