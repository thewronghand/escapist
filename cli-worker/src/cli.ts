import { spawn } from 'child_process'

const TIMEOUT_MS = 120_000
const MAX_BUFFER_BYTES = 10 * 1024 * 1024

export interface ClaudeResponse {
  sessionId: string
  result: string
}

function parseClaudeJson(raw: string): Record<string, unknown> | null {
  let cleaned = raw.trim()
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as Record<string, unknown>
      } catch {
        // 파싱 불가
      }
    }
    return null
  }
}

function runClaude(args: string[]): Promise<ClaudeResponse> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let stdoutBytes = 0
    let stderrBytes = 0
    let killed = false

    const killProc = (reason: string) => {
      if (killed) return
      killed = true
      proc.kill()
      reject(new Error(reason))
    }

    const timer = setTimeout(() => {
      killProc(`Claude CLI timed out after ${TIMEOUT_MS / 1000}s`)
    }, TIMEOUT_MS)

    proc.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length
      if (stdoutBytes > MAX_BUFFER_BYTES) {
        killProc(`stdout exceeded ${MAX_BUFFER_BYTES / 1024 / 1024}MB limit`)
        return
      }
      stdout += chunk.toString()
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length
      if (stderrBytes > MAX_BUFFER_BYTES) {
        killProc(`stderr exceeded ${MAX_BUFFER_BYTES / 1024 / 1024}MB limit`)
        return
      }
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (killed) return

      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
        return
      }

      const json = parseClaudeJson(stdout)
      if (!json) {
        reject(new Error(`Failed to parse Claude response: ${stdout.slice(0, 200)}`))
        return
      }

      if (typeof json.session_id !== 'string' || typeof json.result !== 'string') {
        reject(new Error(`Claude response missing session_id or result: ${stdout.slice(0, 200)}`))
        return
      }

      resolve({
        sessionId: json.session_id,
        result: json.result,
      })
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      if (killed) return
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}`))
    })
  })
}

export async function startSession(
  prompt: string,
  systemPrompt: string,
): Promise<ClaudeResponse> {
  return runClaude([
    '-p', prompt,
    '--system-prompt', systemPrompt,
    '--output-format', 'json',
  ])
}

export async function resumeSession(
  sessionId: string,
  prompt: string,
): Promise<ClaudeResponse> {
  return runClaude([
    '--resume', sessionId,
    '-p', prompt,
    '--output-format', 'json',
  ])
}
