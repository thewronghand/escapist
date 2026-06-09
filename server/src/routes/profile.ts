import { Router } from 'express'
import { db } from '../data/db.js'

export const profileRouter = Router()

const JSON_FIELDS = ['tech_stack', 'interest_stack', 'ai_tools']

function parseRow(row: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (JSON_FIELDS.includes(key) && typeof val === 'string') {
      try { result[camelKey] = JSON.parse(val) } catch { result[camelKey] = [] }
    } else {
      result[camelKey] = val
    }
  }
  return result
}

profileRouter.get('/', (_req, res) => {
  const row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as Record<string, unknown> | undefined
  if (!row) {
    res.json({
      jobRole: 'frontend',
      experienceLevel: 'junior',
      techStack: [],
      interestStack: [],
      aiTools: [],
      memo: '',
    })
    return
  }
  res.json(parseRow(row))
})

profileRouter.put('/', (req, res) => {
  const { jobRole, experienceLevel, techStack, interestStack, aiTools, memo } = req.body

  db.prepare(`
    UPDATE user_profile SET
      job_role = ?,
      experience_level = ?,
      tech_stack = ?,
      interest_stack = ?,
      ai_tools = ?,
      memo = ?,
      updated_at = ?
    WHERE id = 1
  `).run(
    jobRole ?? 'frontend',
    experienceLevel ?? 'junior',
    JSON.stringify(techStack ?? []),
    JSON.stringify(interestStack ?? []),
    JSON.stringify(aiTools ?? []),
    memo ?? '',
    new Date().toISOString(),
  )

  const row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as Record<string, unknown>
  res.json(parseRow(row))
})
