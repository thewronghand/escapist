import { z } from 'zod'
import { router, protectedProcedure } from '../init.js'
import { db } from '../../data/db.js'
import type { UserProfile } from '@escapist/shared'

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

const DEFAULT_PROFILE: UserProfile = {
  jobRole: 'frontend',
  experienceLevel: 'junior',
  techStack: [],
  interestStack: [],
  aiTools: [],
  memo: '',
}

export const profileRouter = router({
  get: protectedProcedure.query(async (): Promise<UserProfile> => {
    const rs = await db.execute('SELECT * FROM user_profile WHERE id = 1')
    return rs.rows.length > 0 ? parseRow(rs.rows[0] as unknown as Record<string, unknown>) : DEFAULT_PROFILE
  }),

  update: protectedProcedure
    .input(z.object({
      jobRole: z.string().optional(),
      experienceLevel: z.string().optional(),
      techStack: z.array(z.string()).optional(),
      interestStack: z.array(z.string()).optional(),
      aiTools: z.array(z.string()).optional(),
      memo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.execute({
        sql: `UPDATE user_profile SET
          job_role = ?, experience_level = ?, tech_stack = ?,
          interest_stack = ?, ai_tools = ?, memo = ?, updated_at = ?
          WHERE id = 1`,
        args: [
          input.jobRole ?? 'frontend',
          input.experienceLevel ?? 'junior',
          JSON.stringify(input.techStack ?? []),
          JSON.stringify(input.interestStack ?? []),
          JSON.stringify(input.aiTools ?? []),
          input.memo ?? '',
          new Date().toISOString(),
        ],
      })
      const rs = await db.execute('SELECT * FROM user_profile WHERE id = 1')
      return parseRow(rs.rows[0] as unknown as Record<string, unknown>)
    }),
})
