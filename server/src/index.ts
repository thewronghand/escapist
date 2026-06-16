import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { questionsRouter } from './routes/questions.js'
import { statsRouter } from './routes/stats.js'
import { sessionsRouter } from './routes/sessions.js'
import { profileRouter } from './routes/profile.js'
import { handleWsConnection } from './ws/handler.js'
import { CLI_WORKER_URL } from './claude/config.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

app.use(express.json())
app.use('/api/questions', questionsRouter)
app.use('/api/stats', statsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/profile', profileRouter)

app.get('/api/health', async (_req, res) => {
  let cliWorker = false
  try {
    const r = await fetch(`${CLI_WORKER_URL}/health`)
    cliWorker = r.ok
  } catch (err) {
    console.warn('[health] CLI worker 연결 실패:', err instanceof Error ? err.message : err)
  }

  res.json({ status: 'ok', cliWorker })
})

wss.on('connection', handleWsConnection)

const PORT = 8888
server.listen(PORT, () => {
  console.log(`Escapist server running on http://localhost:${PORT}`)
})
