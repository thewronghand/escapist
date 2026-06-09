import { Router } from 'express'
import { readAll } from '../data/store.js'

interface Question {
  id: string
  question: string
  category: string
  status: string
  bestScore: number | null
  averageScore: number | null
  attempts: number
  createdAt: string
  lastAttemptAt: string | null
}

interface SessionRecord {
  id: string
  mode: string
  createdAt: string
  lastActivityAt?: string
  questionText?: string
  // 면접 기록용
  totalScore?: number
  grade?: string
  questionCount?: number
  // 무한 기록용
  streak?: number
  totalAnswered?: number
  averageScore?: number
  isNewRecord?: boolean
}

export const statsRouter = Router()

statsRouter.get('/', async (_req, res) => {
  const questions = await readAll<Question>('questions')
  const sessions = await readAll<SessionRecord>('sessions')

  const today = new Date().toISOString().slice(0, 10)

  // 기본 통계
  const totalQuestions = questions.length
  const mastered = questions.filter((q) => q.status === 'master').length
  const withScores = questions.filter((q) => q.averageScore != null)
  const avgScore = withScores.length > 0
    ? Math.round(withScores.reduce((s, q) => s + (q.averageScore ?? 0), 0) / withScores.length * 10) / 10
    : 0

  const todayLearned = sessions.filter(
    (s) => s.mode === 'learn' && s.createdAt?.startsWith(today),
  ).length

  const endlessSessions = sessions.filter((s) => s.mode === 'endless')
  const bestStreak = endlessSessions.reduce((max, s) => Math.max(max, s.streak ?? 0), 0)

  // 약한 질문 (평균 점수 낮은 순)
  const weakQuestions = questions
    .filter((q) => q.averageScore != null && q.averageScore < 5)
    .sort((a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0))
    .slice(0, 7)

  // 카테고리별 통계
  const catMap = new Map<string, { total: number; scoreSum: number; count: number }>()
  for (const q of questions) {
    const entry = catMap.get(q.category) ?? { total: 0, scoreSum: 0, count: 0 }
    entry.total++
    if (q.averageScore != null) {
      entry.scoreSum += q.averageScore
      entry.count++
    }
    catMap.set(q.category, entry)
  }
  const categoryStats = Array.from(catMap.entries())
    .map(([category, { total, scoreSum, count }]) => ({
      category,
      count: total,
      avg: count > 0 ? Math.round(scoreSum / count * 10) / 10 : 0,
    }))
    .sort((a, b) => a.avg - b.avg)

  // 면접 점수 추이
  const interviews = sessions.filter((s) => s.mode === 'interview' && s.totalScore != null)
  const scoreTrend = interviews
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-30)
    .map((s) => ({
      day: new Date(s.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
      score: s.totalScore ?? 0,
    }))

  // 최근 활동
  const recentActivity = sessions
    .filter((s) => ['learn', 'interview', 'endless'].includes(s.mode))
    .sort((a, b) => (b.lastActivityAt ?? b.createdAt).localeCompare(a.lastActivityAt ?? a.createdAt))
    .slice(0, 10)
    .map((s) => ({
      mode: s.mode,
      title: s.questionText || s.id,
      score: s.totalScore ?? s.averageScore,
      grade: s.grade,
      streak: s.streak,
      time: s.lastActivityAt ?? s.createdAt,
    }))

  res.json({
    totalQuestions,
    mastered,
    avgScore,
    todayLearned,
    bestStreak,
    weakQuestions,
    categoryStats,
    scoreTrend,
    recentActivity,
  })
})
