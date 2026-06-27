import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../init.js'
import { db } from '../../data/db.js'
import type { SessionSummary } from '@escapist/shared'

export const sessionsRouter = router({
  list: protectedProcedure
    .input(z.object({ mode: z.string().default('learn') }))
    .query(async ({ input }) => {
      const rs = await db.execute({
        sql: `SELECT id, question_id, question_text, mode, agent, created_at, last_activity_at,
          json_array_length(messages) as message_count
          FROM sessions
          WHERE mode = ?
          ORDER BY COALESCE(last_activity_at, created_at) DESC`,
        args: [input.mode],
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
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const rs = await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [input.id] })
      if (rs.rowsAffected === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' })
      return { ok: true }
    }),
})
