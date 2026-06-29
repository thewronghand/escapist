import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import type { AuthPayload } from '../auth/middleware.js'
import { JWT_SECRET, COOKIE_NAME } from '../auth/config.js'
import { ADMIN_SESSION_SECRET } from '../claude/config.js'
import jwt from 'jsonwebtoken'
import { timingSafeEqual } from 'crypto'

export interface Context {
  user: AuthPayload | null
  isAdminBearer: boolean
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export function createContext({ req }: CreateFastifyContextOptions): Context {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const isAdminBearer = Boolean(
    ADMIN_SESSION_SECRET && bearer && timingSafeStringEqual(bearer, ADMIN_SESSION_SECRET),
  )

  const cookie = req.headers.cookie
  if (!cookie) return { user: null, isAdminBearer }

  const match = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!match) return { user: null, isAdminBearer }

  const token = match.slice(COOKIE_NAME.length + 1)
  try {
    return { user: jwt.verify(token, JWT_SECRET) as AuthPayload, isAdminBearer }
  } catch {
    return { user: null, isAdminBearer }
  }
}
