import { v4 as uuid } from 'uuid'
import type { AdminCommandType, AdminCommandResult } from '@escapist/shared'

export interface CommandEntry {
  commandId: string
  command: AdminCommandType
  payload?: string
  issuedAt: string
  result?: AdminCommandResult
}

// SSE 연결된 관리 세션에 명령을 push하는 콜백
type CommandPushFn = (entry: CommandEntry) => void

const commands = new Map<string, CommandEntry>()
const MAX_COMMANDS = 200
const workerLogs: string[] = []
const MAX_LOGS = 500

// 단일 관리 세션만 지원 — 두 번째 연결이 오면 pushFn을 덮어쓴다.
// 이전 연결은 SSE 스트림이 닫히기 전까지 연결 상태로 보이지만 명령은 받지 못한다.
let pushFn: CommandPushFn | null = null

// 맥북에어에서 spawn된 관제 Claude 세션 ID — cmux에서 직접 붙을 때도 사용
let managerSessionId: string | null = null

export function registerAdminSession(fn: CommandPushFn, sessionId?: string): () => void {
  pushFn = fn
  if (sessionId) managerSessionId = sessionId
  return () => {
    if (pushFn === fn) {
      pushFn = null
      managerSessionId = null
    }
  }
}

export function isAdminSessionConnected(): boolean {
  return pushFn !== null
}

export function getManagerSessionId(): string | null {
  return managerSessionId
}

export function issueCommand(command: AdminCommandType, payload?: string): CommandEntry {
  const entry: CommandEntry = {
    commandId: uuid(),
    command,
    payload,
    issuedAt: new Date().toISOString(),
  }
  commands.set(entry.commandId, entry)
  if (commands.size > MAX_COMMANDS) {
    const oldest = commands.keys().next().value
    if (oldest) commands.delete(oldest)
  }
  pushFn?.(entry)
  return entry
}

export function recordCommandResult(result: AdminCommandResult): boolean {
  const entry = commands.get(result.commandId)
  if (!entry) return false
  entry.result = result
  return true
}

export function getCommandResult(commandId: string): CommandEntry | undefined {
  return commands.get(commandId)
}

export function getRecentCommands(limit = 20): CommandEntry[] {
  return [...commands.values()].slice(-limit)
}

export function appendWorkerLogs(lines: string[]): void {
  workerLogs.push(...lines)
  if (workerLogs.length > MAX_LOGS) workerLogs.splice(0, workerLogs.length - MAX_LOGS)
}

export function getWorkerLogs(limit = 100): string[] {
  return workerLogs.slice(-limit)
}
