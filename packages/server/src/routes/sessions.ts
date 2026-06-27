import type { FastifyInstance } from 'fastify'
import { db } from '../data/db.js'

export async function sessionsPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: { mode?: string } }>('/', async (req) => {
    const mode = req.query.mode ?? 'learn'

    const rows = db.prepare(`
      SELECT id, question_id, question_text, mode, agent, created_at, last_activity_at,
        json_array_length(messages) as message_count
      FROM sessions
      WHERE mode = ?
      ORDER BY COALESCE(last_activity_at, created_at) DESC
    `).all(mode) as Array<Record<string, unknown>>

    return rows.map((r) => ({
      id: r.id,
      questionId: r.question_id,
      questionText: r.question_text,
      mode: r.mode,
      agent: r.agent,
      createdAt: r.created_at,
      lastActivityAt: r.last_activity_at,
      messageCount: r.message_count ?? 0,
    }))
  })

  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id)
    if (result.changes === 0) {
      reply.code(404).send({ error: 'Session not found' })
      return
    }
    return { ok: true }
  })
}
