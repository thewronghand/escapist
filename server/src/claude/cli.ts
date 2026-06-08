import { spawn } from 'child_process'

interface ClaudeResponse {
  sessionId: string
  result: string
}

function runClaude(args: string[]): Promise<ClaudeResponse> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
        return
      }

      try {
        const json = JSON.parse(stdout)
        resolve({
          sessionId: json.session_id,
          result: json.result,
        })
      } catch {
        reject(new Error(`Failed to parse Claude response: ${stdout.slice(0, 200)}`))
      }
    })

    proc.on('error', (err) => {
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
