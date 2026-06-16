import { queryOptions } from '@tanstack/react-query'
import type { Question, SessionSummary, UserProfile } from '@/types'
import type { Stats } from '@/hooks/useStats'
import { request } from '@/lib/api'

export const questionsQuery = queryOptions({
  queryKey: ['questions'],
  queryFn: () => request<Question[]>('/questions'),
})

export const sessionsQuery = (mode = 'learn') => queryOptions({
  queryKey: ['sessions', mode],
  queryFn: () => request<SessionSummary[]>(`/sessions?mode=${mode}`),
})

export const statsQuery = queryOptions({
  queryKey: ['stats'],
  queryFn: () => request<Stats>('/stats'),
})

export const profileQuery = queryOptions({
  queryKey: ['profile'],
  queryFn: () => request<UserProfile>('/profile'),
})
