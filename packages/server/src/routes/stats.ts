import type { FastifyInstance } from 'fastify'
import { db } from '../data/db.js'
import type { Stats } from '@escapist/shared'

export async function statsPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (): Promise<Stats> => {
    const today = new Date().toISOString().slice(0, 10)

    const basicRs = await db.execute(`
      SELECT
        COUNT(*) as total_questions,
        SUM(CASE WHEN status = 'master' THEN 1 ELSE 0 END) as mastered,
        ROUND(AVG(CASE WHEN average_score IS NOT NULL THEN average_score END), 1) as avg_score
      FROM questions
    `)
    const basic = basicRs.rows[0]

    const todayRs = await db.execute({ sql: `SELECT COUNT(*) as count FROM sessions WHERE mode = 'learn' AND created_at LIKE ?`, args: [`${today}%`] })
    const todayLearned = (todayRs.rows[0]?.count as number) ?? 0

    const streakRs = await db.execute(`SELECT MAX(streak) as best FROM sessions WHERE mode = 'endless'`)
    const bestStreak = (streakRs.rows[0]?.best as number) ?? 0

    const weakRs = await db.execute(`
      SELECT id, question, category, average_score as averageScore, attempts
      FROM questions
      WHERE average_score IS NOT NULL AND average_score < 5
      ORDER BY average_score ASC
      LIMIT 7
    `)
    const weakQuestions = weakRs.rows.map((r) => ({
      id: r.id as string,
      question: r.question as string,
      category: r.category as string,
      averageScore: r.averageScore as number,
      attempts: r.attempts as number,
    }))

    const catRs = await db.execute(`
      SELECT
        category,
        COUNT(*) as count,
        ROUND(AVG(CASE WHEN average_score IS NOT NULL THEN average_score END), 1) as avg
      FROM questions
      GROUP BY category
      ORDER BY avg ASC
    `)
    const categoryStats = catRs.rows.map((r) => ({
      category: r.category as string,
      count: r.count as number,
      avg: r.avg as number,
    }))

    const trendRs = await db.execute(`
      SELECT created_at, total_score as score
      FROM sessions
      WHERE mode = 'interview' AND total_score IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 30
    `)
    const scoreTrend = trendRs.rows.map((r) => ({
      day: new Date(r.created_at as string).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
      score: r.score as number,
    }))

    const actRs = await db.execute(`
      SELECT
        mode, question_text as title,
        total_score as score, grade, streak,
        COALESCE(last_activity_at, created_at) as time
      FROM sessions
      WHERE mode IN ('learn', 'interview', 'endless')
      ORDER BY COALESCE(last_activity_at, created_at) DESC
      LIMIT 10
    `)
    const recentActivity = actRs.rows.map((r) => ({
      mode: r.mode as string,
      title: r.title as string,
      score: r.score as number | undefined,
      grade: r.grade as string | undefined,
      streak: r.streak as number | undefined,
      time: r.time as string,
    }))

    return {
      totalQuestions: (basic?.total_questions as number) ?? 0,
      mastered: (basic?.mastered as number) ?? 0,
      avgScore: (basic?.avg_score as number) ?? 0,
      todayLearned,
      bestStreak,
      weakQuestions,
      categoryStats,
      scoreTrend,
      recentActivity,
    }
  })
}
