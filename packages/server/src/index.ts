import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyWebsocket from '@fastify/websocket'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { questionsPlugin } from './routes/questions.js'
import { statsPlugin } from './routes/stats.js'
import { sessionsPlugin } from './routes/sessions.js'
import { profilePlugin } from './routes/profile.js'
import { handleWsConnection } from './ws/handler.js'
import { CLI_WORKER_URL } from './claude/config.js'
import { logger } from './lib/logger.js'
import { authPlugin } from './auth/routes.js'
import { authGuardHook, extractUserFromCookie } from './auth/middleware.js'
import { GOOGLE_CLIENT_ID } from './auth/config.js'
import { appRouter } from './trpc/router.js'
import { createContext } from './trpc/context.js'

const app = Fastify({ loggerInstance: logger })

await app.register(fastifyCookie)
await app.register(fastifyCors, { origin: true, credentials: true })
await app.register(fastifyWebsocket)

await app.register(authPlugin, { prefix: '/api/auth' })

app.get('/api/health', async () => {
  let cliWorker = false
  try {
    const r = await fetch(`${CLI_WORKER_URL}/health`)
    cliWorker = r.ok
  } catch (err) {
    logger.warn({ err }, 'CLI worker 연결 실패')
  }
  return { status: 'ok', cliWorker }
})

const apiOptions = GOOGLE_CLIENT_ID ? { onRequest: [authGuardHook] } : {}

await app.register(questionsPlugin, { prefix: '/api/questions', ...apiOptions })
await app.register(statsPlugin, { prefix: '/api/stats', ...apiOptions })
await app.register(sessionsPlugin, { prefix: '/api/sessions', ...apiOptions })
await app.register(profilePlugin, { prefix: '/api/profile', ...apiOptions })

await app.register(fastifyTRPCPlugin, {
  prefix: '/api/trpc',
  trpcOptions: { router: appRouter, createContext },
})

app.get('/ws', { websocket: true }, (socket, req) => {
  if (GOOGLE_CLIENT_ID) {
    const cookieHeader = req.headers.cookie
    const user = extractUserFromCookie(typeof cookieHeader === 'string' ? cookieHeader : undefined)
    if (!user) {
      socket.close(4001, 'Unauthorized')
      return
    }
  }
  handleWsConnection(socket)
})

const PORT = 8888
await app.listen({ port: PORT, host: '0.0.0.0' })
logger.info(`Escapist server running on http://localhost:${PORT}`)
