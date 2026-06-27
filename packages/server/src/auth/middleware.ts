import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET, COOKIE_NAME } from './config.js'
import { logger } from '../lib/logger.js'

export interface AuthPayload {
  email: string
  name: string
  picture: string
}

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    if (typeof decoded.email !== 'string') {
      res.status(401).json({ error: 'Invalid token payload' })
      return
    }
    res.locals.user = {
      email: decoded.email,
      name: typeof decoded.name === 'string' ? decoded.name : '',
      picture: typeof decoded.picture === 'string' ? decoded.picture : '',
    } satisfies AuthPayload
    next()
  } catch {
    logger.warn('JWT 검증 실패')
    res.status(401).json({ error: 'Invalid token' })
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
