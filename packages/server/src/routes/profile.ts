import type { FastifyInstance } from 'fastify'
import { db } from '../data/db.js'
import type { UserProfile } from '@escapist/shared'

export async function profilePlugin(fastify: FastifyInstance): Promise<void> {
  const JSON_FIELDS = ['tech_stack', 'interest_stack', 'ai_tools']

  function parseRow(row: Record<string, unknown>): UserProfile {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
      if (JSON_FIELDS.includes(key) && typeof val === 'string') {
        try { result[camelKey] = JSON.parse(val) } catch { result[camelKey] = [] }
      } else {
        result[camelKey] = val
      }
    }
    return result as unknown as UserProfile
  }

  fastify.get('/', async () => {
    const rs = await db.execute('SELECT * FROM user_profile WHERE id = 1')
    if (rs.rows.length === 0) {
      return { jobRole: 'frontend', experienceLevel: 'junior', techStack: [], interestStack: [], aiTools: [], memo: '' }
    }
    return parseRow(rs.rows[0] as unknown as Record<string, unknown>)
  })

  fastify.put<{ Body: { jobRole?: string; experienceLevel?: string; techStack?: string[]; interestStack?: string[]; aiTools?: string[]; memo?: string } }>(
    '/',
    async (req) => {
      const { jobRole, experienceLevel, techStack, interestStack, aiTools, memo } = req.body

      await db.execute({
        sql: `UPDATE user_profile SET
          job_role = ?, experience_level = ?, tech_stack = ?,
          interest_stack = ?, ai_tools = ?, memo = ?, updated_at = ?
          WHERE id = 1`,
        args: [
          jobRole ?? 'frontend',
          experienceLevel ?? 'junior',
          JSON.stringify(techStack ?? []),
          JSON.stringify(interestStack ?? []),
          JSON.stringify(aiTools ?? []),
          memo ?? '',
          new Date().toISOString(),
        ],
      })

      const rs = await db.execute('SELECT * FROM user_profile WHERE id = 1')
      return parseRow(rs.rows[0] as unknown as Record<string, unknown>)
    },
  )
}
