import type { FastifyInstance } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  JWT_SECRET,
  ALLOWED_EMAIL,
  JWT_EXPIRES_IN,
  COOKIE_NAME,
} from './config.js'
import { logger } from '../lib/logger.js'

function getRedirectUri(req: { protocol: string; hostname: string; headers: Record<string, string | string[] | undefined> }): string {
  // Render 등 프록시 환경에서 실제 프로토콜을 x-forwarded-proto 헤더로 판단
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol
  return `${proto}://${req.hostname}/api/auth/callback`
}

export async function authPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.get('/login', (req, reply) => {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, getRedirectUri(req))
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    })
    reply.redirect(url)
  })

  fastify.get<{ Querystring: { code?: string } }>('/callback', async (req, reply) => {
    const code = req.query.code
    if (!code) {
      reply.code(400).send('Authorization code missing')
      return
    }

    try {
      const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, getRedirectUri(req))
      const { tokens } = await client.getToken(code)
      client.setCredentials(tokens)

      if (!tokens.id_token) {
        reply.code(400).send('Google에서 ID 토큰을 반환하지 않았습니다')
        return
      }

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
      })
      const payload = ticket.getPayload()
      if (!payload?.email) {
        reply.code(400).send('이메일 정보를 가져올 수 없습니다')
        return
      }

      if (ALLOWED_EMAIL && payload.email !== ALLOWED_EMAIL) {
        logger.warn({ email: payload.email }, '허용되지 않은 이메일 로그인 시도')
        reply.code(403).send('접근 권한이 없습니다')
        return
      }

      const token = jwt.sign(
        { email: payload.email, name: payload.name ?? '', picture: payload.picture ?? '' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      )

      reply.setCookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: req.protocol === 'https',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })

      logger.info({ email: payload.email }, '로그인 성공')
      reply.redirect('/')
    } catch (err) {
      logger.error({ err }, 'OAuth 콜백 처리 실패')
      reply.code(500).send('로그인 처리 중 오류가 발생했습니다')
    }
  })

  fastify.post('/logout', (_req, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' })
    reply.send({ ok: true })
  })

  fastify.get('/me', (req, reply) => {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) {
      reply.send({ authenticated: false })
      return
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
      if (typeof decoded.email !== 'string') {
        reply.send({ authenticated: false })
        return
      }
      reply.send({
        authenticated: true,
        user: {
          email: decoded.email,
          name: typeof decoded.name === 'string' ? decoded.name : '',
          picture: typeof decoded.picture === 'string' ? decoded.picture : '',
        },
      })
    } catch {
      reply.send({ authenticated: false })
    }
  })
}
