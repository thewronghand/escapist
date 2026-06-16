import { CLI_WORKER_URL, CLI_WORKER_SECRET } from './config.js'

interface ClaudeResponse {
  sessionId: string
  result: string
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (CLI_WORKER_SECRET) {
    headers['Authorization'] = `Bearer ${CLI_WORKER_SECRET}`
  }
  return headers
}

export async function startSession(
  prompt: string,
  systemPrompt: string,
): Promise<ClaudeResponse> {
  const res = await fetch(`${CLI_WORKER_URL}/claude/start`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ prompt, systemPrompt }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new Error(`CLI worker error: ${body.error ?? res.statusText}`)
  }

  return res.json() as Promise<ClaudeResponse>
}

export async function resumeSession(
  sessionId: string,
  prompt: string,
): Promise<ClaudeResponse> {
  const res = await fetch(`${CLI_WORKER_URL}/claude/resume`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ sessionId, prompt }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new Error(`CLI worker error: ${body.error ?? res.statusText}`)
  }

  return res.json() as Promise<ClaudeResponse>
}
