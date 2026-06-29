import { v4 as uuid } from 'uuid'
import type { WebSocket } from '@fastify/websocket'
import { CLI_WORKER_SECRET } from './config.js'
import { logger } from '../lib/logger.js'
import type { WorkerRequest, WorkerLogReport } from '@escapist/shared'
import { WorkerEvent } from '@escapist/shared'
import { appendWorkerLogs } from '../admin/store.js'

interface ClaudeResponse {
  sessionId: string
  result: string
}

type PendingResolve = (value: ClaudeResponse) => void
type PendingReject = (reason: Error) => void

let workerSocket: WebSocket | null = null
const pending = new Map<string, { resolve: PendingResolve; reject: PendingReject }>()

export function isWorkerConnected(): boolean {
  return workerSocket !== null
}

export function handleWorkerConnection(socket: WebSocket, authHeader: string | undefined): void {
  if (CLI_WORKER_SECRET) {
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    if (token !== CLI_WORKER_SECRET) {
      logger.warn('cli-worker 인증 실패')
      socket.close(4001, 'Unauthorized')
      return
    }
  }

  if (workerSocket) {
    logger.warn('기존 cli-worker 연결 종료 후 새 연결 수락')
    workerSocket.close()
  }

  workerSocket = socket
  logger.info('cli-worker 연결됨')

  socket.on('message', (raw) => {
    let msg: { type: string; requestId?: string; sessionId?: string; result?: string; error?: string; lines?: string[] }
    try {
      msg = JSON.parse(raw.toString()) as typeof msg
    } catch {
      return
    }

    if (msg.type === WorkerEvent.LOG_REPORT) {
      const report = msg as unknown as WorkerLogReport
      if (Array.isArray(report.lines)) {
        appendWorkerLogs(report.lines)
        logger.debug({ count: report.lines.length }, 'PM2 로그 수신')
      }
      return
    }

    if (!msg.requestId) return

    const entry = pending.get(msg.requestId)
    if (!entry) return

    pending.delete(msg.requestId)

    if (msg.type === WorkerEvent.RESULT && msg.sessionId && typeof msg.result === 'string') {
      entry.resolve({ sessionId: msg.sessionId, result: msg.result })
    } else {
      entry.reject(new Error(msg.error ?? 'Unknown worker error'))
    }
  })

  socket.on('close', () => {
    if (workerSocket !== socket) return
    workerSocket = null
    logger.warn('cli-worker 연결 끊김')
    for (const { reject } of pending.values()) {
      reject(new Error('CLI worker disconnected'))
    }
    pending.clear()
  })

  socket.on('error', (err) => {
    logger.error({ err }, 'cli-worker WS 에러')
  })
}

function sendRequest(req: WorkerRequest, timeoutMs = 120_000): Promise<ClaudeResponse> {
  return new Promise((resolve, reject) => {
    if (!workerSocket) {
      reject(new Error('CLI worker offline'))
      return
    }

    const timer = setTimeout(() => {
      pending.delete(req.requestId)
      reject(new Error('CLI worker request timed out'))
    }, timeoutMs)

    pending.set(req.requestId, {
      resolve: (val) => { clearTimeout(timer); resolve(val) },
      reject: (err) => { clearTimeout(timer); reject(err) },
    })

    workerSocket.send(JSON.stringify(req))
  })
}

export async function startSession(prompt: string, systemPrompt: string): Promise<ClaudeResponse> {
  return sendRequest({
    type: WorkerEvent.START,
    requestId: uuid(),
    prompt,
    systemPrompt,
  })
}

export async function resumeSession(sessionId: string, prompt: string): Promise<ClaudeResponse> {
  return sendRequest({
    type: WorkerEvent.RESUME,
    requestId: uuid(),
    sessionId,
    prompt,
  })
}
