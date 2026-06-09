import { useState, useEffect, useCallback } from 'react'

interface WeakQuestion {
  id: string
  question: string
  category: string
  averageScore: number
  attempts: number
}

interface CategoryStat {
  category: string
  count: number
  avg: number
}

interface ScoreTrendPoint {
  day: string
  score: number
}

interface ActivityItem {
  mode: string
  title: string
  score?: number
  grade?: string
  streak?: number
  time: string
}

export interface Stats {
  totalQuestions: number
  mastered: number
  avgScore: number
  todayLearned: number
  bestStreak: number
  weakQuestions: WeakQuestion[]
  categoryStats: CategoryStat[]
  scoreTrend: ScoreTrendPoint[]
  recentActivity: ActivityItem[]
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json() as Stats
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { stats, loading, reload: load }
}
