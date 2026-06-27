export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
export const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL ?? ''
export const JWT_EXPIRES_IN = '7d'
export const COOKIE_NAME = 'escapist_token'

export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[FATAL] JWT_SECRET must be set in production')
    process.exit(1)
  }
  return secret ?? 'dev-secret-change-me'
})()
