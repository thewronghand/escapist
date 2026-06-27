import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import type { AuthPayload } from '../auth/middleware.js'
import { JWT_SECRET, COOKIE_NAME } from '../auth/config.js'
import jwt from 'jsonwebtoken'

export interface Context {
  user: AuthPayload | null
}

export function createContext({ req }: CreateFastifyContextOptions): Context {
  const cookie = req.headers.cookie
  if (!cookie) return { user: null }

  const match = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!match) return { user: null }

  const token = match.slice(COOKIE_NAME.length + 1)
  try {
    return { user: jwt.verify(token, JWT_SECRET) as AuthPayload }
  } catch {
    return { user: null }
  }
}
