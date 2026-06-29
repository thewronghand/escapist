export const WorkerEvent = {
  // server → worker
  START: 'worker:start',
  RESUME: 'worker:resume',
  // worker → server
  RESULT: 'worker:result',
  ERROR: 'worker:error',
  LOG_REPORT: 'worker:log_report',
} as const

// ── Admin channel ──────────────────────────────────────────────────────────

export const AdminEvent = {
  // server → admin-session (SSE)
  COMMAND: 'admin:command',
  // admin-session → server (POST)
  RESULT: 'admin:result',
} as const

export type AdminCommandType = 'restart' | 'update' | 'custom'

export interface AdminCommandRequest {
  type: typeof AdminEvent.COMMAND
  commandId: string
  command: AdminCommandType
  /** custom 명령일 때 실행할 셸 명령어 */
  payload?: string
  issuedAt: string
}

export interface AdminCommandResult {
  type: typeof AdminEvent.RESULT
  commandId: string
  success: boolean
  output: string
  finishedAt: string
}

// ── Worker log report ──────────────────────────────────────────────────────

export interface WorkerLogReport {
  type: typeof WorkerEvent.LOG_REPORT
  lines: string[]
}

export type WorkerEventType = typeof WorkerEvent[keyof typeof WorkerEvent]

export interface WorkerStartRequest {
  type: typeof WorkerEvent.START
  requestId: string
  prompt: string
  systemPrompt: string
}

export interface WorkerResumeRequest {
  type: typeof WorkerEvent.RESUME
  requestId: string
  sessionId: string
  prompt: string
}

export type WorkerRequest = WorkerStartRequest | WorkerResumeRequest

export interface WorkerResultResponse {
  type: typeof WorkerEvent.RESULT
  requestId: string
  sessionId: string
  result: string
}

export interface WorkerErrorResponse {
  type: typeof WorkerEvent.ERROR
  requestId: string
  error: string
}

export type WorkerResponse = WorkerResultResponse | WorkerErrorResponse
