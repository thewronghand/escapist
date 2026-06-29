import Fastify, { type FastifyRequest } from 'fastify'
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
import { GOOGLE_CLIENT_ID, ALLOWED_EMAIL } from './auth/config.js'
import { CLI_WORKER_SECRET, ADMIN_SESSION_SECRET } from './claude/config.js'
import { timingSafeEqual } from 'crypto'
import { appRouter } from './trpc/router.js'
import { createContext } from './trpc/context.js'
import { registerAdminSession, recordCommandResult } from './admin/store.js'
import { AdminEvent } from '@escapist/shared'
import { z } from 'zod'

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

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// 관리 세션 인증 헬퍼
// 1순위: ADMIN_SESSION_SECRET Bearer 토큰 (timing-safe 비교)
// 2순위: JWT 쿠키 + ALLOWED_EMAIL (둘 다 설정된 경우만)
// 둘 다 미설정이면 fail-closed — admin은 원격 실행 권한이라 열어두지 않는다
function isAdminRequest(req: FastifyRequest): boolean {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (ADMIN_SESSION_SECRET && bearer && timingSafeStringEqual(bearer, ADMIN_SESSION_SECRET)) return true

  if (!GOOGLE_CLIENT_ID || !ALLOWED_EMAIL) return false
  const cookieHeader = req.headers.cookie
  const user = extractUserFromCookie(typeof cookieHeader === 'string' ? cookieHeader : undefined)
  if (!user) return false
  return user.email === ALLOWED_EMAIL
}

const adminResultSchema = z.object({
  type: z.literal(AdminEvent.RESULT),
  commandId: z.string().min(1),
  success: z.boolean(),
  output: z.string(),
  finishedAt: z.string(),
})

// 맥북에어 관리 세션 SSE 연결 (단일 연결만 지원 — 재연결 시 이전 pushFn 덮어씀)
app.get('/api/admin/commands/stream', async (req, reply) => {
  if (!isAdminRequest(req)) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  reply.raw.flushHeaders()

  const sessionId = typeof req.query === 'object' && req.query !== null
    ? (req.query as Record<string, string>)['sessionId']
    : undefined

  const unregister = registerAdminSession((entry) => {
    const data = JSON.stringify({ type: AdminEvent.COMMAND, ...entry })
    reply.raw.write(`data: ${data}\n\n`)
  }, sessionId)

  // 연결 확인용 최초 이벤트
  reply.raw.write(`data: ${JSON.stringify({ type: 'admin:connected', sessionId: sessionId ?? null })}\n\n`)

  // 리버스 프록시 유휴 타임아웃 방지 keep-alive
  const keepAlive = setInterval(() => {
    reply.raw.write(': ping\n\n')
  }, 25_000)

  req.raw.on('close', () => {
    clearInterval(keepAlive)
    unregister()
    logger.info('관리 세션 SSE 연결 종료')
  })

  logger.info('관리 세션 SSE 연결됨')
  await new Promise<void>((resolve) => req.raw.on('close', resolve))
})

// 관리 세션 결과 보고
app.post('/api/admin/commands/result', async (req, reply) => {
  if (!isAdminRequest(req)) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }

  const parsed = adminResultSchema.safeParse(req.body)
  if (!parsed.success) {
    reply.code(400).send({ error: 'Invalid body' })
    return
  }

  const ok = recordCommandResult(parsed.data)
  if (!ok) {
    reply.code(404).send({ error: 'Command not found' })
    return
  }

  logger.info({ commandId: parsed.data.commandId, success: parsed.data.success }, '관리 명령 결과 수신')
  return { ok: true }
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

if (!CLI_WORKER_SECRET) {
  logger.warn('CLI_WORKER_SECRET 미설정 — /worker 엔드포인트가 인증 없이 열려있습니다')
}
if (!ADMIN_SESSION_SECRET) {
  logger.warn('ADMIN_SESSION_SECRET 미설정 — /api/admin/* 엔드포인트는 쿠키+ALLOWED_EMAIL 인증만 허용됩니다')
}
