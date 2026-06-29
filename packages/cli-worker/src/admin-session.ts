/**
 * 맥북에어 관리 세션 — escapist 서버 SSE를 감시하며 원격 명령을 실행한다.
 * PM2로 상시 실행: npx pm2 start ecosystem.config.cjs --only escapist-admin
 */

import { execFile } from 'child_process'
import { logger } from './logger.js'
import type { AdminCommandRequest, AdminCommandResult } from '@escapist/shared'
import { AdminEvent } from '@escapist/shared'

const SERVER_BASE = process.env.ADMIN_SERVER_URL ?? 'https://escapist.onrender.com'
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET ?? ''

// custom 명령 화이트리스트 — 셸 메타문자 인젝션을 원천 차단하기 위해 execFile(shell:false) 사용
const ALLOWED_CUSTOM_COMMANDS: Record<string, { file: string; args: string[] }> = {
  'pm2 status': { file: 'pm2', args: ['status'] },
  'pm2 logs': { file: 'pm2', args: ['logs', '--lines', '50', '--nostream'] },
  'pm2 list': { file: 'pm2', args: ['list'] },
  'git status': { file: 'git', args: ['status'] },
  'git log': { file: 'git', args: ['log', '--oneline', '-10'] },
  'git pull': { file: 'git', args: ['pull'] },
  'node --version': { file: 'node', args: ['--version'] },
  'pnpm --version': { file: 'pnpm', args: ['--version'] },
}

function runSafe(
  file: string,
  args: string[],
  timeoutMs = 60_000,
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    execFile(
      file,
      args,
      { timeout: timeoutMs, cwd: process.env.WORKER_CWD ?? process.cwd() },
      (err, stdout, stderr) => {
        const output = [stdout, stderr].filter(Boolean).join('\n').trim()
        resolve({ success: !err, output: output.slice(0, 5_000) })
      },
    )
  })
}

async function handleCommand(req: AdminCommandRequest): Promise<AdminCommandResult> {
  logger.info({ command: req.command, commandId: req.commandId }, '관리 명령 수신')

  let result: { success: boolean; output: string }

  switch (req.command) {
    case 'restart':
      result = await runSafe('pm2', ['restart', 'escapist-worker'])
      break

    case 'update':
      // admin-session 자신은 재시작하지 않음 — 재시작 중 결과 보고가 끊기기 때문
      result = await runSafe('sh', [
        '-c',
        'git pull && pnpm install --frozen-lockfile && pm2 restart escapist-worker',
      ])
      break

    case 'custom': {
      if (!req.payload) {
        return {
          type: AdminEvent.RESULT,
          commandId: req.commandId,
          success: false,
          output: 'custom 명령에 payload가 없습니다',
          finishedAt: new Date().toISOString(),
        }
      }
      const allowed = ALLOWED_CUSTOM_COMMANDS[req.payload.trim()]
      if (!allowed) {
        logger.warn({ payload: req.payload }, '허용되지 않은 custom 명령')
        const list = Object.keys(ALLOWED_CUSTOM_COMMANDS).join(', ')
        return {
          type: AdminEvent.RESULT,
          commandId: req.commandId,
          success: false,
          output: `허용된 명령 목록: ${list}`,
          finishedAt: new Date().toISOString(),
        }
      }
      result = await runSafe(allowed.file, allowed.args)
      break
    }

    default:
      return {
        type: AdminEvent.RESULT,
        commandId: req.commandId,
        success: false,
        output: `알 수 없는 명령: ${String((req as AdminCommandRequest).command)}`,
        finishedAt: new Date().toISOString(),
      }
  }

  logger.info({ commandId: req.commandId, success: result.success }, '관리 명령 완료')

  return {
    type: AdminEvent.RESULT,
    commandId: req.commandId,
    success: result.success,
    output: result.output,
    finishedAt: new Date().toISOString(),
  }
}

async function reportResult(result: AdminCommandResult): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (ADMIN_SECRET) headers['Authorization'] = `Bearer ${ADMIN_SECRET}`

  try {
    const res = await fetch(`${SERVER_BASE}/api/admin/commands/result`, {
      method: 'POST',
      headers,
      body: JSON.stringify(result),
    })
    if (!res.ok) {
      logger.warn({ status: res.status }, '결과 보고 실패')
    }
  } catch (err) {
    // SSE 루프를 깨지 않도록 catch — 결과 유실 로그만 남김
    logger.error({ err }, '결과 보고 네트워크 에러 (명령 결과 유실)')
  }
}

function connectSse(): void {
  const url = `${SERVER_BASE}/api/admin/commands/stream`
  const headers: Record<string, string> = {}
  if (ADMIN_SECRET) headers['Authorization'] = `Bearer ${ADMIN_SECRET}`

  logger.info({ url }, '관리 세션 SSE 연결 시도')

  fetch(url, { headers })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        logger.error({ status: res.status }, 'SSE 연결 실패 — 30초 후 재시도')
        setTimeout(connectSse, 30_000)
        return
      }

      logger.info('SSE 연결 성공, 명령 대기 중')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let msg: { type: string } & Partial<AdminCommandRequest>
          try {
            msg = JSON.parse(raw) as typeof msg
          } catch {
            continue
          }

          if (msg.type === AdminEvent.COMMAND && msg.commandId && msg.command) {
            const cmdResult = await handleCommand(msg as AdminCommandRequest)
            await reportResult(cmdResult)
          }
        }
      }

      logger.warn('SSE 스트림 종료 — 5초 후 재연결')
      setTimeout(connectSse, 5_000)
    })
    .catch((err) => {
      logger.error({ err }, 'SSE fetch 에러 — 30초 후 재시도')
      setTimeout(connectSse, 30_000)
    })
}

logger.info('Escapist 관리 세션 시작')
connectSse()
