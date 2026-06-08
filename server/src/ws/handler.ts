import type { WebSocket } from 'ws'
import { v4 as uuid } from 'uuid'
import { startSession, resumeSession } from '../claude/cli.js'
import { getPromptForAgent, HINT_PROMPT, SANDBOX_PROMPT } from '../claude/prompts.js'
import { readOne, writeOne } from '../data/store.js'

interface HintEntry {
  level: number
  content: string
  createdAt: string
}

interface Session {
  id: string
  claudeSessionId: string
  questionId: string
  questionText: string
  mode: string
  agent: string
  hints?: HintEntry[]
  hintSessionId?: string
  createdAt: string
}

interface ClientMessage {
  type: string
  sessionId?: string
  questionId?: string
  questionText?: string
  message?: string
  agent?: string
  hintLevel?: number
  sandboxId?: string
}

export function handleWsConnection(ws: WebSocket) {
  ws.on('message', async (raw) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      ws.send(JSON.stringify({ type: 'chat:error', error: 'Invalid JSON' }))
      return
    }

    try {
      switch (msg.type) {
        case 'chat:send':
          await handleChatSend(ws, msg)
          break
        case 'hint:request':
          await handleHintRequest(ws, msg)
          break
        case 'hint:load':
          await handleHintLoad(ws, msg)
          break
        case 'sandbox:send':
          await handleSandboxSend(ws, msg)
          break
        default:
          ws.send(JSON.stringify({ type: 'chat:error', error: `Unknown type: ${msg.type}` }))
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      ws.send(JSON.stringify({ type: 'chat:error', error }))
    }
  })
}

async function handleChatSend(ws: WebSocket, msg: ClientMessage) {
  const agent = msg.agent ?? 'interviewer'

  // 세션이 없으면 새로 생성 (첫 답변)
  if (!msg.sessionId) {
    const questionText = msg.questionText ?? ''
    const systemPrompt = getPromptForAgent(agent)
    const prompt = `면접 질문: "${questionText}"\n\n사용자의 답변: ${msg.message ?? ''}\n\n위 답변을 평가해주세요.`

    ws.send(JSON.stringify({ type: 'chat:typing', agent }))

    const response = await startSession(prompt, systemPrompt)

    const sessionId = `s_${uuid().slice(0, 8)}`
    const session: Session = {
      id: sessionId,
      claudeSessionId: response.sessionId,
      questionId: msg.questionId ?? '',
      questionText,
      mode: 'learn',
      agent,
      createdAt: new Date().toISOString(),
    }
    await writeOne('sessions', sessionId, session)

    ws.send(JSON.stringify({
      type: 'session:created',
      sessionId,
      claudeSessionId: response.sessionId,
    }))

    ws.send(JSON.stringify({
      type: 'chat:response',
      message: {
        id: uuid(),
        role: agent,
        text: response.result,
        timestamp: new Date().toISOString(),
      },
    }))
    return
  }

  // 기존 세션 이어가기
  const session = await readOne<Session>('sessions', msg.sessionId)
  if (!session) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'Session not found' }))
    return
  }

  ws.send(JSON.stringify({ type: 'chat:typing', agent }))

  const response = await resumeSession(
    session.claudeSessionId,
    msg.message ?? '',
  )

  ws.send(JSON.stringify({
    type: 'chat:response',
    message: {
      id: uuid(),
      role: agent,
      text: response.result,
      timestamp: new Date().toISOString(),
    },
  }))
}

async function handleHintRequest(ws: WebSocket, msg: ClientMessage) {
  const questionId = msg.questionId ?? ''
  const questionText = msg.questionText ?? ''

  // 질문별 힌트 데이터 로드 (있으면)
  const hintDataId = `hints_${questionId}`
  let hintData = await readOne<Session>('sessions', hintDataId)

  const level = (hintData?.hints?.length ?? 0) + 1
  if (level > 5) {
    ws.send(JSON.stringify({ type: 'chat:error', error: '힌트를 모두 사용했어요' }))
    return
  }

  ws.send(JSON.stringify({ type: 'hint:loading' }))

  if (!hintData) {
    // 첫 힌트 → 힌트 세션 생성
    const prompt = `면접 질문: "${questionText}"\n\n힌트 ${level}단계를 제공해주세요.`
    const response = await startSession(prompt, HINT_PROMPT)

    hintData = {
      id: hintDataId,
      claudeSessionId: response.sessionId,
      questionId,
      questionText,
      mode: 'hint',
      agent: 'tutor',
      hints: [{ level, content: response.result, createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    }
    await writeOne('sessions', hintDataId, hintData)

    ws.send(JSON.stringify({
      type: 'hint:response',
      questionId,
      level,
      result: response.result,
      hints: hintData.hints,
    }))
    return
  }

  // 기존 힌트 세션 이어가기
  const prompt = `힌트 ${level}단계를 제공해주세요. 이전 힌트보다 더 구체적으로 알려주세요.`
  const response = await resumeSession(hintData.claudeSessionId, prompt)

  const newHint: HintEntry = { level, content: response.result, createdAt: new Date().toISOString() }
  hintData.hints = [...(hintData.hints ?? []), newHint]
  await writeOne('sessions', hintDataId, hintData)

  ws.send(JSON.stringify({
    type: 'hint:response',
    questionId,
    level,
    result: response.result,
    hints: hintData.hints,
  }))
}

async function handleHintLoad(ws: WebSocket, msg: ClientMessage) {
  const questionId = msg.questionId ?? ''
  const hintDataId = `hints_${questionId}`
  const hintData = await readOne<Session>('sessions', hintDataId)

  ws.send(JSON.stringify({
    type: 'hint:loaded',
    questionId,
    hints: hintData?.hints ?? [],
  }))
}

async function handleSandboxSend(ws: WebSocket, msg: ClientMessage) {
  ws.send(JSON.stringify({ type: 'sandbox:typing' }))

  if (!msg.sandboxId) {
    // 새 샌드박스 세션
    const response = await startSession(msg.message ?? '', SANDBOX_PROMPT)

    const sandboxId = `sb_${uuid().slice(0, 8)}`
    const session: Session = {
      id: sandboxId,
      claudeSessionId: response.sessionId,
      questionId: '',
      questionText: '',
      mode: 'sandbox',
      agent: 'tutor',
      createdAt: new Date().toISOString(),
    }
    await writeOne('sessions', sandboxId, session)

    ws.send(JSON.stringify({
      type: 'sandbox:created',
      sandboxId,
    }))

    ws.send(JSON.stringify({
      type: 'sandbox:response',
      message: {
        id: uuid(),
        text: response.result,
        timestamp: new Date().toISOString(),
      },
    }))
    return
  }

  // 기존 샌드박스 이어가기
  const session = await readOne<Session>('sessions', msg.sandboxId)
  if (!session) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'Sandbox session not found' }))
    return
  }

  const response = await resumeSession(session.claudeSessionId, msg.message ?? '')

  ws.send(JSON.stringify({
    type: 'sandbox:response',
    message: {
      id: uuid(),
      text: response.result,
      timestamp: new Date().toISOString(),
    },
  }))
}
