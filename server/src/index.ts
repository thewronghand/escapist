import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { questionsRouter } from './routes/questions.js'
import { statsRouter } from './routes/stats.js'
import { sessionsRouter } from './routes/sessions.js'
import { handleWsConnection } from './ws/handler.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

app.use(express.json())
app.use('/api/questions', questionsRouter)
app.use('/api/stats', statsRouter)
app.use('/api/sessions', sessionsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

wss.on('connection', handleWsConnection)

const PORT = 8888
server.listen(PORT, () => {
  console.log(`Escapist server running on http://localhost:${PORT}`)
})
