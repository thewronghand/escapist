import { Router } from 'express'
import { db } from '../data/db.js'

export const sessionsRouter = Router()

sessionsRouter.get('/', (req, res) => {
  const mode = (req.query.mode as string) ?? 'learn'

  const rows = db.prepare(`
    SELECT id, question_id, question_text, mode, agent, created_at, last_activity_at,
      json_array_length(messages) as message_count
    FROM sessions
    WHERE mode = ?
    ORDER BY COALESCE(last_activity_at, created_at) DESC
  `).all(mode) as Array<Record<string, unknown>>

  const sessions = rows.map((r) => ({
    id: r.id,
    questionId: r.question_id,
    questionText: r.question_text,
    mode: r.mode,
    agent: r.agent,
    createdAt: r.created_at,
    lastActivityAt: r.last_activity_at,
    messageCount: r.message_count ?? 0,
  }))

  res.json(sessions)
})

sessionsRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.json({ ok: true })
})
