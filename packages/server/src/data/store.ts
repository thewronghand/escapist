import { db } from './db.js'
import type { InValue } from '@libsql/client'

const JSON_FIELDS: Record<string, string[]> = {
  questions: ['tags'],
  sessions: ['messages', 'hints', 'categories'],
  user_profile: ['tech_stack', 'interest_stack', 'ai_tools'],
}

function parseRow<T>(collection: string, row: Record<string, unknown>): T {
  const jsonFields = JSON_FIELDS[collection] ?? []
  const parsed = { ...row }
  for (const field of jsonFields) {
    if (typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field] as string)
      } catch {
        // 파싱 실패 시 원본 유지
      }
    }
  }
  return snakeToCamel(parsed) as T
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => (c as string).toUpperCase())
    result[camelKey] = val
  }
  return result
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    result[snakeKey] = val
  }
  return result
}

function serializeForDb(collection: string, data: Record<string, unknown>): Record<string, unknown> {
  const snake = camelToSnake(data)
  const jsonFields = JSON_FIELDS[collection] ?? []
  for (const field of jsonFields) {
    if (snake[field] != null && typeof snake[field] !== 'string') {
      snake[field] = JSON.stringify(snake[field])
    }
  }
  return snake
}

const ALLOWED_TABLES = new Set(['questions', 'sessions', 'user_profile'])

function assertTable(collection: string): void {
  if (!ALLOWED_TABLES.has(collection)) {
    throw new Error(`허용되지 않은 테이블: ${collection}`)
  }
}

export async function readAll<T>(collection: string): Promise<T[]> {
  assertTable(collection)
  const rs = await db.execute(`SELECT * FROM ${collection}`)
  return rs.rows.map((row) => parseRow<T>(collection, row as unknown as Record<string, unknown>))
}

export async function readOne<T>(collection: string, id: string): Promise<T | null> {
  assertTable(collection)
  const rs = await db.execute({ sql: `SELECT * FROM ${collection} WHERE id = ?`, args: [id] })
  if (rs.rows.length === 0) return null
  return parseRow<T>(collection, rs.rows[0] as unknown as Record<string, unknown>)
}

export async function writeOne(collection: string, _id: string, data: unknown): Promise<void> {
  assertTable(collection)
  const serialized = serializeForDb(collection, data as Record<string, unknown>)

  const columns = Object.keys(serialized)
  const placeholders = columns.map(() => '?').join(', ')
  const updates = columns.map((c) => `${c} = excluded.${c}`).join(', ')

  const sql = `INSERT INTO ${collection} (${columns.join(', ')}) VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET ${updates}`

  await db.execute({ sql, args: columns.map((c) => (serialized[c] ?? null) as InValue) })
}

export async function deleteOne(collection: string, id: string): Promise<boolean> {
  assertTable(collection)
  const rs = await db.execute({ sql: `DELETE FROM ${collection} WHERE id = ?`, args: [id] })
  return rs.rowsAffected > 0
}
