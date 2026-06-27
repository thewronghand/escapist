import type { FastifyInstance } from 'fastify'
import { db } from '../data/db.js'
import type { SessionSummary } from '@escapist/shared'

export async function sessionsPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: { mode?: string } }>('/', async (req) => {
    const mode = req.query.mode ?? 'learn'

    const rs = await db.execute({
      sql: `SELECT id, question_id, question_text, mode, agent, created_at, last_activity_at,
        json_array_length(messages) as message_count
        FROM sessions
        WHERE mode = ?
        ORDER BY COALESCE(last_activity_at, created_at) DESC`,
      args: [mode],
    })

    return rs.rows.map((r): SessionSummary => ({
      id: r.id as string,
      questionId: r.question_id as string,
      questionText: r.question_text as string,
      mode: r.mode as string,
      agent: r.agent as string,
      createdAt: r.created_at as string,
      lastActivityAt: r.last_activity_at as string | undefined,
      messageCount: (r.message_count as number) ?? 0,
    }))
  })

  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const rs = await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [req.params.id] })
    if (rs.rowsAffected === 0) {
      reply.code(404).send({ error: 'Session not found' })
      return
    }
    return { ok: true }
  })
}
