import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { JWT_SECRET, COOKIE_NAME } from './config.js'
import { logger } from '../lib/logger.js'

export interface AuthPayload {
  email: string
  name: string
  picture: string
}

export async function authGuardHook(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    if (typeof decoded.email !== 'string') {
      reply.code(401).send({ error: 'Invalid token payload' })
      return
    }
    req.user = {
      email: decoded.email,
      name: typeof decoded.name === 'string' ? decoded.name : '',
      picture: typeof decoded.picture === 'string' ? decoded.picture : '',
    } satisfies AuthPayload
  } catch {
    logger.warn('JWT 검증 실패')
    reply.code(401).send({ error: 'Invalid token' })
  }
}

export function extractUserFromCookie(cookie: string | undefined): AuthPayload | null {
  if (!cookie) return null

  const match = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null

  const token = match.slice(COOKIE_NAME.length + 1)
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}
