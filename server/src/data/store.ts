import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.resolve(import.meta.dirname, '../../data')

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function readAll<T>(collection: string): Promise<T[]> {
  const dir = path.join(DATA_DIR, collection)
  await ensureDir(dir)
  const files = await fs.readdir(dir)
  const items: T[] = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const raw = await fs.readFile(path.join(dir, file), 'utf-8')
    items.push(JSON.parse(raw) as T)
  }
  return items
}

export async function readOne<T>(collection: string, id: string): Promise<T | null> {
  const filePath = path.join(DATA_DIR, collection, `${id}.json`)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function writeOne<T>(collection: string, id: string, data: T): Promise<void> {
  const dir = path.join(DATA_DIR, collection)
  await ensureDir(dir)
  const filePath = path.join(dir, `${id}.json`)
  const tmp = filePath + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tmp, filePath)
}

export async function deleteOne(collection: string, id: string): Promise<boolean> {
  const filePath = path.join(DATA_DIR, collection, `${id}.json`)
  try {
    await fs.unlink(filePath)
    return true
  } catch {
    return false
  }
}
