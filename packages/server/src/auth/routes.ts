import { Router } from 'express'
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

export const authRouter = Router()

function getRedirectUri(req: { protocol: string; get: (name: string) => string | undefined }): string {
  return `${req.protocol}://${req.get('host')}/api/auth/callback`
}

authRouter.get('/login', (req, res) => {
  const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, getRedirectUri(req))
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  })
  res.redirect(url)
})

authRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string | undefined
  if (!code) {
    res.status(400).send('Authorization code missing')
    return
  }

  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, getRedirectUri(req))
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    if (!tokens.id_token) {
      res.status(400).send('Google에서 ID 토큰을 반환하지 않았습니다')
      return
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      res.status(400).send('이메일 정보를 가져올 수 없습니다')
      return
    }

    if (ALLOWED_EMAIL && payload.email !== ALLOWED_EMAIL) {
      logger.warn({ email: payload.email }, '허용되지 않은 이메일 로그인 시도')
      res.status(403).send('접근 권한이 없습니다')
      return
    }

    const token = jwt.sign(
      { email: payload.email, name: payload.name ?? '', picture: payload.picture ?? '' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: req.protocol === 'https',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    logger.info({ email: payload.email }, '로그인 성공')
    res.redirect('/')
  } catch (err) {
    logger.error({ err }, 'OAuth 콜백 처리 실패')
    res.status(500).send('로그인 처리 중 오류가 발생했습니다')
  }
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

authRouter.get('/me', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!token) {
    res.json({ authenticated: false })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    if (typeof decoded.email !== 'string') {
      res.json({ authenticated: false })
      return
    }
    res.json({
      authenticated: true,
      user: {
        email: decoded.email,
        name: typeof decoded.name === 'string' ? decoded.name : '',
        picture: typeof decoded.picture === 'string' ? decoded.picture : '',
      },
    })
  } catch {
    res.json({ authenticated: false })
  }
})
