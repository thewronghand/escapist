/**
 * 맥북에어 관리 세션 — escapist 서버 SSE를 감시하며 원격 명령을 실행한다.
 * 시작 시 관제 Claude 세션을 자동 spawn하고 session_id를 서버에 등록한다.
 * PM2로 상시 실행: npx pm2 start ecosystem.config.cjs --only escapist-admin
 */

import { execFile, spawn } from 'child_process'
import { logger } from './logger.js'
import type { AdminCommandRequest, AdminCommandResult } from '@escapist/shared'
import { AdminEvent } from '@escapist/shared'

const SERVER_BASE = process.env.ADMIN_SERVER_URL ?? 'https://escapist.onrender.com'
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET ?? ''
// 관제 Claude 세션에 --add-dir로 로드할 프로젝트 루트 (CLAUDE.md 위치)
const MANAGER_CLAUDE_DIR = process.env.MANAGER_CLAUDE_DIR ?? ''

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

// ── 관제 Claude 세션 ─────────────────────────────────────────────────────────

let managerSessionId: string | null = null

function parseClaudeJson(raw: string): { session_id?: string; result?: string } | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '')
  try {
    return JSON.parse(cleaned) as { session_id?: string; result?: string }
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as { session_id?: string; result?: string } } catch { /* ignore */ }
    }
    return null
  }
}

function spawnManagerSession(): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '--dangerously-skip-permissions',
      '--model', 'claude-opus-4-7',
      '--output-format', 'json',
      '-p', '관제 세션 시작. 이후 --resume으로 메시지를 받을 예정입니다. 짧게 인사해주세요.',
    ]
    if (MANAGER_CLAUDE_DIR) args.push('--add-dir', MANAGER_CLAUDE_DIR)

    const proc = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.env.WORKER_CWD ?? process.cwd(),
    })
    proc.stdin.end()

    let stdout = ''
    const timer = setTimeout(() => {
      proc.kill()
      reject(new Error('관제 세션 spawn 타임아웃 (120s)'))
    }, 120_000)

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) { reject(new Error(`spawn 실패 (exit ${code})`)); return }
      const json = parseClaudeJson(stdout)
      if (!json?.session_id) { reject(new Error(`session_id 파싱 실패: ${stdout.slice(0, 200)}`)); return }
      resolve(json.session_id)
    })
    proc.on('error', (err) => { clearTimeout(timer); reject(err) })
  })
}

async function sendManagerMessage(payload: string): Promise<string> {
  if (!managerSessionId) throw new Error('관제 세션이 초기화되지 않았습니다')

  return new Promise((resolve, reject) => {
    const args = [
      '--resume', managerSessionId!,
      '--dangerously-skip-permissions',
      '--model', 'claude-opus-4-7',
      '--output-format', 'json',
      '-p', payload,
    ]

    const proc = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.env.WORKER_CWD ?? process.cwd(),
    })
    proc.stdin.end()

    let stdout = ''
    const timer = setTimeout(() => { proc.kill(); reject(new Error('관제 세션 응답 타임아웃 (120s)')) }, 120_000)

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) { reject(new Error(`claude 종료 코드 ${code}`)); return }
      const json = parseClaudeJson(stdout)
      if (!json?.result) { reject(new Error(`result 파싱 실패: ${stdout.slice(0, 200)}`)); return }
      // claude --resume은 session_id를 바꾸지 않으므로 갱신 불필요
      resolve(json.result)
    })
    proc.on('error', (err) => { clearTimeout(timer); reject(err) })
  })
}

// ── 명령 실행 ─────────────────────────────────────────────────────────────────

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

    case 'update': {
      const beforeResult = await runSafe('git', ['rev-parse', 'HEAD'], 10_000)
      if (!beforeResult.success) {
        result = { success: false, output: `HEAD SHA 조회 실패:\n${beforeResult.output}` }
        break
      }
      const beforeSha = beforeResult.output.trim()

      const pullResult = await runSafe('git', ['pull'], 60_000)
      if (!pullResult.success) {
        result = { success: false, output: `git pull 실패:\n${pullResult.output}` }
        break
      }

      const verifyResult = await runSafe('git', ['verify-commit', 'HEAD'], 10_000)
      if (!verifyResult.success) {
        logger.warn({ beforeSha }, 'GPG 서명 검증 실패 — git reset 롤백')
        const rollbackResult = await runSafe('git', ['reset', '--hard', beforeSha])
        const rollbackMsg = rollbackResult.success
          ? `롤백 완료 (→ ${beforeSha.slice(0, 8)})`
          : `롤백 실패 — 수동 개입 필요\n${rollbackResult.output}`
        result = {
          success: false,
          output: `GPG 서명 검증 실패\n${verifyResult.output}\n${rollbackMsg}`,
        }
        break
      }

      // admin-session 자신은 재시작하지 않음 — 재시작 중 결과 보고가 끊기기 때문
      const installResult = await runSafe('pnpm', ['install', '--frozen-lockfile'], 120_000)
      if (!installResult.success) {
        result = { success: false, output: `pnpm install 실패:\n${installResult.output}` }
        break
      }

      const restartResult = await runSafe('pm2', ['restart', 'escapist-worker'])
      result = {
        success: restartResult.success,
        output: [pullResult.output, verifyResult.output, installResult.output, restartResult.output]
          .filter(Boolean).join('\n---\n'),
      }
      break
    }

    case 'custom': {
      if (!req.payload) {
        return {
          type: AdminEvent.RESULT, commandId: req.commandId,
          success: false, output: 'custom 명령에 payload가 없습니다',
          finishedAt: new Date().toISOString(),
        }
      }
      const allowed = ALLOWED_CUSTOM_COMMANDS[req.payload.trim()]
      if (!allowed) {
        const list = Object.keys(ALLOWED_CUSTOM_COMMANDS).join(', ')
        return {
          type: AdminEvent.RESULT, commandId: req.commandId,
          success: false, output: `허용된 명령 목록: ${list}`,
          finishedAt: new Date().toISOString(),
        }
      }
      result = await runSafe(allowed.file, allowed.args)
      break
    }

    case 'message': {
      if (!req.payload) {
        return {
          type: AdminEvent.RESULT, commandId: req.commandId,
          success: false, output: '메시지 내용이 없습니다',
          finishedAt: new Date().toISOString(),
        }
      }
      try {
        const response = await sendManagerMessage(req.payload)
        result = { success: true, output: response }
      } catch (err) {
        result = { success: false, output: err instanceof Error ? err.message : '관제 세션 오류' }
      }
      break
    }

    default:
      return {
        type: AdminEvent.RESULT, commandId: req.commandId,
        success: false, output: `알 수 없는 명령: ${String((req as AdminCommandRequest).command)}`,
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

// ── 결과 보고 & SSE 연결 ──────────────────────────────────────────────────────

async function reportResult(result: AdminCommandResult): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (ADMIN_SECRET) headers['Authorization'] = `Bearer ${ADMIN_SECRET}`

  try {
    const res = await fetch(`${SERVER_BASE}/api/admin/commands/result`, {
      method: 'POST', headers, body: JSON.stringify(result),
    })
    if (!res.ok) logger.warn({ status: res.status }, '결과 보고 실패')
  } catch (err) {
    logger.error({ err }, '결과 보고 네트워크 에러 (명령 결과 유실)')
  }
}

function connectSse(sessionId: string | null): void {
  const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''
  const url = `${SERVER_BASE}/api/admin/commands/stream${params}`
  const headers: Record<string, string> = {}
  if (ADMIN_SECRET) headers['Authorization'] = `Bearer ${ADMIN_SECRET}`

  logger.info({ url }, '관리 세션 SSE 연결 시도')

  fetch(url, { headers })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        logger.error({ status: res.status }, 'SSE 연결 실패 — 30초 후 재시도')
        setTimeout(() => connectSse(managerSessionId), 30_000)
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
          try { msg = JSON.parse(raw) as typeof msg } catch { continue }

          if (msg.type === AdminEvent.COMMAND && msg.commandId && msg.command) {
            const cmdResult = await handleCommand(msg as AdminCommandRequest)
            await reportResult(cmdResult)
          }
        }
      }

      logger.warn('SSE 스트림 종료 — 5초 후 재연결')
      setTimeout(() => connectSse(managerSessionId), 5_000)
    })
    .catch((err) => {
      logger.error({ err }, 'SSE fetch 에러 — 30초 후 재시도')
      setTimeout(() => connectSse(managerSessionId), 30_000)
    })
}

// ── 시작 ─────────────────────────────────────────────────────────────────────

logger.info('Escapist 관리 세션 시작 — 관제 Claude 세션 초기화 중')

spawnManagerSession()
  .then((sessionId) => {
    managerSessionId = sessionId
    logger.info({ sessionId }, `관제 세션 준비 완료 — cmux에서 붙으려면: claude --resume ${sessionId}`)
    connectSse(sessionId)
  })
  .catch((err) => {
    logger.error({ err }, '관제 세션 spawn 실패 — SSE는 sessionId 없이 연결')
    connectSse(null)
  })
