import express, { type Request, type Response, type NextFunction } from 'express'
import { startSession, resumeSession } from './cli.js'
import { logger } from './logger.js'

const app = express()
app.use(express.json({ limit: '1mb' }))

const WORKER_SECRET = process.env.CLI_WORKER_SECRET ?? ''

if (!WORKER_SECRET && process.env.NODE_ENV === 'production') {
  logger.fatal('CLI_WORKER_SECRET must be set in production')
  process.exit(1)
}

if (!WORKER_SECRET) {
  logger.warn('CLI_WORKER_SECRET이 설정되지 않았습니다. 모든 요청이 허용됩니다.')
}

function authGuard(req: Request, res: Response, next: NextFunction): void {
  if (!WORKER_SECRET) {
    next()
    return
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (token !== WORKER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cli-worker' })
})

app.post('/claude/start', authGuard, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : ''

  if (!prompt || !systemPrompt) {
    res.status(400).json({ error: 'prompt and systemPrompt are required' })
    return
  }

  try {
    const result = await startSession(prompt, systemPrompt)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'claude/start 실패')
    res.status(500).json({ error: message })
  }
})

app.post('/claude/resume', authGuard, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  const prompt = typeof body.prompt === 'string' ? body.prompt : ''

  if (!sessionId || !prompt) {
    res.status(400).json({ error: 'sessionId and prompt are required' })
    return
  }

  try {
    const result = await resumeSession(sessionId, prompt)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err, sessionId }, 'claude/resume 실패')
    res.status(500).json({ error: message })
  }
})

const PORT = Number(process.env.CLI_WORKER_PORT ?? 8889)
app.listen(PORT, () => {
  logger.info(`Escapist CLI worker running on http://localhost:${PORT}`)
})
