import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyWebsocket from '@fastify/websocket'
import fastifyStatic from '@fastify/static'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import path from 'path'
import { questionsPlugin } from './routes/questions.js'
import { statsPlugin } from './routes/stats.js'
import { sessionsPlugin } from './routes/sessions.js'
import { profilePlugin } from './routes/profile.js'
import { handleWsConnection } from './ws/handler.js'
import { handleWorkerConnection, isWorkerConnected } from './claude/worker-bridge.js'
import { logger } from './lib/logger.js'
import { authPlugin } from './auth/routes.js'
import { authGuardHook, extractUserFromCookie } from './auth/middleware.js'
import { GOOGLE_CLIENT_ID } from './auth/config.js'
import { CLI_WORKER_SECRET } from './claude/config.js'
import { appRouter } from './trpc/router.js'
import { createContext } from './trpc/context.js'

const app = Fastify({ loggerInstance: logger })

await app.register(fastifyCookie)
await app.register(fastifyCors, { origin: true, credentials: true })
await app.register(fastifyWebsocket)

// 프로덕션에서 client 빌드 결과물 서빙
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(import.meta.dirname, '../../client/dist')
  await app.register(fastifyStatic, {
    root: clientDist,
    wildcard: false,
  })
}

await app.register(authPlugin, { prefix: '/api/auth' })

app.get('/api/health', async () => ({
  status: 'ok',
  cliWorker: isWorkerConnected(),
}))

const apiOptions = GOOGLE_CLIENT_ID ? { onRequest: [authGuardHook] } : {}

await app.register(questionsPlugin, { prefix: '/api/questions', ...apiOptions })
await app.register(statsPlugin, { prefix: '/api/stats', ...apiOptions })
await app.register(sessionsPlugin, { prefix: '/api/sessions', ...apiOptions })
await app.register(profilePlugin, { prefix: '/api/profile', ...apiOptions })

await app.register(fastifyTRPCPlugin, {
  prefix: '/api/trpc',
  trpcOptions: { router: appRouter, createContext },
})

// 사용자 클라이언트 WS
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

// cli-worker WS 연결
app.get('/worker', { websocket: true }, (socket, req) => {
  handleWorkerConnection(socket, req.headers.authorization)
})

// SPA fallback — React Router가 처리하는 경로를 index.html로
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(import.meta.dirname, '../../client/dist')
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html', clientDist)
  })
}

const PORT = Number(process.env.PORT ?? 8888)
await app.listen({ port: PORT, host: '0.0.0.0' })
logger.info(`Escapist server running on http://localhost:${PORT}`)

// cli-worker에 사용할 환경변수 힌트 (개발용)
if (!CLI_WORKER_SECRET) {
  logger.warn('CLI_WORKER_SECRET 미설정 — /worker 엔드포인트가 인증 없이 열려있습니다')
}
