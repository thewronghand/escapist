import WebSocket from 'ws'
import { exec } from 'child_process'
import { startSession, resumeSession } from './cli.js'
import { logger } from './logger.js'
import type { WorkerRequest, WorkerResponse, WorkerLogReport } from '@escapist/shared'
import { WorkerEvent } from '@escapist/shared'

const SERVER_URL = process.env.WS_SERVER_URL ?? 'ws://localhost:8888/worker'
const WORKER_SECRET = process.env.CLI_WORKER_SECRET ?? ''
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

let reconnectDelay = RECONNECT_BASE_MS
let ws: WebSocket | null = null

function connect() {
  const headers: Record<string, string> = {}
  if (WORKER_SECRET) headers['Authorization'] = `Bearer ${WORKER_SECRET}`

  ws = new WebSocket(SERVER_URL, { headers })

  ws.on('open', () => {
    logger.info({ url: SERVER_URL }, 'CLI worker → 서버 WS 연결 완료')
    reconnectDelay = RECONNECT_BASE_MS
    sendPm2Logs()
  })

  ws.on('message', async (raw) => {
    let req: WorkerRequest
    try {
      req = JSON.parse(raw.toString()) as WorkerRequest
    } catch {
      logger.warn('잘못된 메시지 수신')
      return
    }

    logger.info({ type: req.type, requestId: req.requestId }, 'Claude 요청 수신')

    try {
      let result
      if (req.type === WorkerEvent.START) {
        result = await startSession(req.prompt, req.systemPrompt)
      } else if (req.type === WorkerEvent.RESUME) {
        result = await resumeSession(req.sessionId, req.prompt)
      } else {
        return
      }

      const response: WorkerResponse = {
        type: WorkerEvent.RESULT,
        requestId: req.requestId,
        sessionId: result.sessionId,
        result: result.result,
      }
      ws?.send(JSON.stringify(response))
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ err, requestId: req.requestId }, 'Claude 처리 실패')
      const response: WorkerResponse = {
        type: WorkerEvent.ERROR,
        requestId: req.requestId,
        error,
      }
      ws?.send(JSON.stringify(response))
    }
  })

  ws.on('ping', () => {
    ws?.pong()
  })

  ws.on('close', (code, reason) => {
    logger.warn({ code, reason: reason.toString() }, `WS 연결 끊김 — ${reconnectDelay / 1000}s 후 재연결`)
    scheduleReconnect()
  })

  ws.on('error', (err) => {
    logger.error({ err }, 'WS 에러')
  })
}

function scheduleReconnect() {
  setTimeout(() => {
    connect()
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS)
  }, reconnectDelay)
}

function sendPm2Logs() {
  exec('pm2 logs --lines 100 --nostream --raw 2>&1', { timeout: 10_000 }, (err, stdout) => {
    if (err) {
      logger.warn({ err }, 'PM2 로그 읽기 실패 — PM2 미설치 또는 권한 없음')
      return
    }
    const lines = stdout.split('\n').filter((l) => l.trim().length > 0)
    if (lines.length === 0) return

    const report: WorkerLogReport = { type: WorkerEvent.LOG_REPORT, lines }
    ws?.send(JSON.stringify(report))
    logger.debug({ count: lines.length }, 'PM2 로그 전송')
  })
}

logger.info('Escapist CLI worker 시작')
connect()
