import { router, protectedProcedure } from '../init.js'
import { db } from '../../data/db.js'
import type { Stats } from '@escapist/shared'

export const statsRouter = router({
  get: protectedProcedure.query((): Stats => {
    const today = new Date().toISOString().slice(0, 10)

    const basicStats = db.prepare(`
      SELECT
        COUNT(*) as total_questions,
        SUM(CASE WHEN status = 'master' THEN 1 ELSE 0 END) as mastered,
        ROUND(AVG(CASE WHEN average_score IS NOT NULL THEN average_score END), 1) as avg_score
      FROM questions
    `).get() as Record<string, unknown>

    const todayLearned = (db.prepare(`
      SELECT COUNT(*) as count FROM sessions
      WHERE mode = 'learn' AND created_at LIKE ?
    `).get(`${today}%`) as Record<string, unknown>)?.count ?? 0

    const bestStreak = (db.prepare(`
      SELECT MAX(streak) as best FROM sessions WHERE mode = 'endless'
    `).get() as Record<string, unknown>)?.best ?? 0

    const weakQuestions = db.prepare(`
      SELECT id, question, category, average_score as averageScore, attempts
      FROM questions
      WHERE average_score IS NOT NULL AND average_score < 5
      ORDER BY average_score ASC
      LIMIT 7
    `).all() as Stats['weakQuestions']

    const categoryStats = db.prepare(`
      SELECT
        category,
        COUNT(*) as count,
        ROUND(AVG(CASE WHEN average_score IS NOT NULL THEN average_score END), 1) as avg
      FROM questions
      GROUP BY category
      ORDER BY avg ASC
    `).all() as Stats['categoryStats']

    const scoreTrendRaw = db.prepare(`
      SELECT created_at, total_score as score
      FROM sessions
      WHERE mode = 'interview' AND total_score IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 30
    `).all() as Array<{ created_at: string; score: number }>

    const scoreTrend = scoreTrendRaw.map((r) => ({
      day: new Date(r.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
      score: r.score,
    }))

    const recentActivity = db.prepare(`
      SELECT
        mode, question_text as title,
        total_score as score, grade, streak,
        COALESCE(last_activity_at, created_at) as time
      FROM sessions
      WHERE mode IN ('learn', 'interview', 'endless')
      ORDER BY COALESCE(last_activity_at, created_at) DESC
      LIMIT 10
    `).all() as Stats['recentActivity']

    return {
      totalQuestions: (basicStats.total_questions as number) ?? 0,
      mastered: (basicStats.mastered as number) ?? 0,
      avgScore: (basicStats.avg_score as number) ?? 0,
      todayLearned: todayLearned as number,
      bestStreak: bestStreak as number,
      weakQuestions,
      categoryStats,
      scoreTrend,
      recentActivity,
    }
  }),
})
