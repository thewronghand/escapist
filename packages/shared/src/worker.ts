export const WorkerEvent = {
  // server → worker
  START: 'worker:start',
  RESUME: 'worker:resume',
  // worker → server
  RESULT: 'worker:result',
  ERROR: 'worker:error',
} as const

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
