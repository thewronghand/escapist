import { db } from './db.js'

// JSON 필드를 파싱하는 헬퍼
const JSON_FIELDS: Record<string, string[]> = {
  questions: ['tags'],
  sessions: ['messages', 'hints', 'categories'],
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
  // snake_case → camelCase 변환
  return snakeToCamel(parsed) as T
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
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

export function readAll<T>(collection: string): T[] {
  const rows = db.prepare(`SELECT * FROM ${collection}`).all() as Record<string, unknown>[]
  return rows.map((row) => parseRow<T>(collection, row))
}

export function readOne<T>(collection: string, id: string): T | null {
  const row = db.prepare(`SELECT * FROM ${collection} WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return parseRow<T>(collection, row)
}

export function writeOne(collection: string, id: string, data: unknown): void {
  const serialized = serializeForDb(collection, data as Record<string, unknown>)

  // 존재하면 UPDATE, 없으면 INSERT (UPSERT)
  const columns = Object.keys(serialized)
  const placeholders = columns.map(() => '?').join(', ')
  const updates = columns.map((c) => `${c} = excluded.${c}`).join(', ')

  const sql = `INSERT INTO ${collection} (${columns.join(', ')}) VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET ${updates}`

  db.prepare(sql).run(...columns.map((c) => serialized[c] ?? null))
}

export function deleteOne(collection: string, id: string): boolean {
  const result = db.prepare(`DELETE FROM ${collection} WHERE id = ?`).run(id)
  return result.changes > 0
}
