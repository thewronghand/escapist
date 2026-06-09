import { queryOptions } from '@tanstack/react-query'
import type { Question, SessionSummary, UserProfile } from '@/types'
import type { Stats } from '@/hooks/useStats'

const BASE = '/api'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export const questionsQuery = queryOptions({
  queryKey: ['questions'],
  queryFn: () => fetchJson<Question[]>('/questions'),
})

export const sessionsQuery = (mode = 'learn') => queryOptions({
  queryKey: ['sessions', mode],
  queryFn: () => fetchJson<SessionSummary[]>(`/sessions?mode=${mode}`),
})

export const statsQuery = queryOptions({
  queryKey: ['stats'],
  queryFn: () => fetchJson<Stats>('/stats'),
})

export const profileQuery = queryOptions({
  queryKey: ['profile'],
  queryFn: () => fetchJson<UserProfile>('/profile'),
})
