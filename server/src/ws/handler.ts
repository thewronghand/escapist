import type { WebSocket } from 'ws'
import { v4 as uuid } from 'uuid'
import { startSession, resumeSession } from '../claude/cli.js'
import { getPromptForAgent, HINT_PROMPT, SANDBOX_PROMPT, buildGeneratorPrompt, type ProfileData } from '../claude/prompts.js'
import { readAll, readOne, writeOne } from '../data/store.js'
import { db } from '../data/db.js'

interface MessageEntry {
  id: string
  role: string
  text: string
  agent?: string
  timestamp: string
}

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
  messages?: MessageEntry[]
  hints?: HintEntry[]
  hintSessionId?: string
  createdAt: string
  lastActivityAt?: string
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
  // 면접/무한 채점용
  questionForEval?: string
  answerForEval?: string
  interviewData?: Record<string, unknown>
  interviewType?: string
  // 질문 자동 생성용
  generateType?: string
  generateCount?: number
}

interface QuestionRecord {
  id: string
  bestScore: number | null
  averageScore: number | null
  attempts: number
  status: string
  lastAttemptAt: string | null
}

function tryExtractScore(text: string): number | null {
  try {
    // ```json 코드블록 제거
    let cleaned = text.trim()
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (codeBlockMatch) cleaned = codeBlockMatch[1].trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (typeof parsed.score === 'number') return parsed.score
    }
  } catch { /* ignore */ }
  return null
}

function updateQuestionScore(questionId: string, score: number): void {
  if (!questionId) return
  const question = readOne<QuestionRecord>('questions', questionId)
  if (!question) return

  const attempts = (question.attempts ?? 0) + 1
  const prevAvg = question.averageScore ?? 0
  const newAvg = prevAvg === 0 ? score : Math.round(((prevAvg * (attempts - 1) + score) / attempts) * 10) / 10
  const bestScore = Math.max(question.bestScore ?? 0, score)

  let status = question.status
  if (bestScore >= 8) status = 'master'
  else if (newAvg < 5) status = 'weak'
  else status = 'learning'

  writeOne('questions', questionId, {
    ...question,
    bestScore,
    averageScore: newAvg,
    attempts,
    status,
    lastAttemptAt: new Date().toISOString(),
  })
}

function appendMessage(session: Session, msg: MessageEntry): Session {
  session.messages = [...(session.messages ?? []), msg]
  session.lastActivityAt = new Date().toISOString()
  return session
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
        case 'session:list':
          await handleSessionList(ws, msg)
          break
        case 'session:load':
          await handleSessionLoad(ws, msg)
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
        case 'interview:eval':
          await handleInterviewEval(ws, msg)
          break
        case 'interview:summary':
          await handleInterviewSummary(ws, msg)
          break
        case 'interview:save':
          await handleInterviewSave(ws, msg)
          break
        case 'questions:generate':
          await handleQuestionsGenerate(ws, msg)
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
  const isSkip = msg.message === '__SKIP__'
  const userMessage = isSkip ? '모르겠습니다. 이 질문에 대해 설명해주세요.' : (msg.message ?? '')

  // 세션이 없으면 새로 생성 (첫 답변)
  if (!msg.sessionId) {
    const questionText = msg.questionText ?? ''
    const systemPrompt = getPromptForAgent(agent, msg.interviewType)
    const prompt = isSkip
      ? `면접 질문: "${questionText}"\n\n사용자가 이 질문에 답변하지 못했습니다. 핵심 개념을 쉽게 설명해주고, 이해를 확인하는 질문을 해주세요.`
      : `면접 질문: "${questionText}"\n\n사용자의 답변: ${userMessage}\n\n위 답변을 평가해주세요.`

    ws.send(JSON.stringify({ type: 'chat:typing', agent }))

    const response = await startSession(prompt, systemPrompt)

    const sessionId = `s_${uuid().slice(0, 8)}`
    const now = new Date().toISOString()

    // user 메시지 + assistant 메시지 저장
    const userMsg: MessageEntry = { id: uuid(), role: isSkip ? 'skip' : 'user', text: isSkip ? '모르겠다' : (msg.message ?? ''), timestamp: now }
    const assistantMsg: MessageEntry = { id: uuid(), role: agent, agent, text: response.result, timestamp: now }

    const session: Session = {
      id: sessionId,
      claudeSessionId: response.sessionId,
      questionId: msg.questionId ?? '',
      questionText,
      mode: 'learn',
      agent,
      messages: [userMsg, assistantMsg],
      createdAt: now,
      lastActivityAt: now,
    }
    await writeOne('sessions', sessionId, session)

    // 질문 점수 업데이트
    const score = tryExtractScore(response.result)
    if (score !== null) updateQuestionScore(msg.questionId ?? '', score)

    ws.send(JSON.stringify({
      type: 'session:created',
      sessionId,
      claudeSessionId: response.sessionId,
    }))

    ws.send(JSON.stringify({
      type: 'chat:response',
      message: assistantMsg,
    }))
    return
  }

  // 기존 세션 이어가기
  const session = await readOne<Session>('sessions', msg.sessionId)
  if (!session) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'Session not found' }))
    return
  }

  // user 메시지 저장
  const now = new Date().toISOString()
  const userMsg: MessageEntry = { id: uuid(), role: isSkip ? 'skip' : 'user', text: isSkip ? '모르겠다' : (msg.message ?? ''), timestamp: now }
  appendMessage(session, userMsg)

  ws.send(JSON.stringify({ type: 'chat:typing', agent }))

  const resumePrompt = isSkip
    ? '사용자가 이 질문에 답변하지 못했습니다. 핵심 개념을 쉽게 설명해주고, 이해를 확인하는 질문을 해주세요.'
    : (msg.message ?? '')
  const response = await resumeSession(session.claudeSessionId, resumePrompt)

  // assistant 메시지 저장
  const assistantMsg: MessageEntry = { id: uuid(), role: agent, agent, text: response.result, timestamp: now }
  appendMessage(session, assistantMsg)
  await writeOne('sessions', session.id, session)

  // 질문 점수 업데이트
  const score = tryExtractScore(response.result)
  if (score !== null) updateQuestionScore(session.questionId, score)

  ws.send(JSON.stringify({
    type: 'chat:response',
    message: assistantMsg,
  }))
}

async function handleSessionList(ws: WebSocket, msg: ClientMessage) {
  const mode = msg.message ?? 'learn'
  const sessions = await readAll<Session>('sessions')

  const filtered = sessions
    .filter((s) => s.mode === mode)
    .sort((a, b) => (b.lastActivityAt ?? b.createdAt).localeCompare(a.lastActivityAt ?? a.createdAt))
    .map(({ id, questionId, questionText, mode: m, agent, createdAt, lastActivityAt, messages }) => ({
      id,
      questionId,
      questionText,
      mode: m,
      agent,
      createdAt,
      lastActivityAt,
      messageCount: messages?.length ?? 0,
    }))

  ws.send(JSON.stringify({ type: 'session:list', sessions: filtered }))
}

async function handleSessionLoad(ws: WebSocket, msg: ClientMessage) {
  if (!msg.sessionId) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'sessionId is required' }))
    return
  }

  const session = await readOne<Session>('sessions', msg.sessionId)
  if (!session) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'Session not found' }))
    return
  }

  ws.send(JSON.stringify({
    type: 'session:loaded',
    session: {
      id: session.id,
      claudeSessionId: session.claudeSessionId,
      questionId: session.questionId,
      questionText: session.questionText,
      mode: session.mode,
      agent: session.agent,
      messages: session.messages ?? [],
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
    },
  }))
}

async function handleHintRequest(ws: WebSocket, msg: ClientMessage) {
  const questionId = msg.questionId ?? ''
  const questionText = msg.questionText ?? ''

  const hintDataId = `hints_${questionId}`
  let hintData = await readOne<Session>('sessions', hintDataId)

  const level = (hintData?.hints?.length ?? 0) + 1
  if (level > 5) {
    ws.send(JSON.stringify({ type: 'chat:error', error: '힌트를 모두 사용했어요' }))
    return
  }

  ws.send(JSON.stringify({ type: 'hint:loading' }))

  if (!hintData) {
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

    ws.send(JSON.stringify({ type: 'sandbox:created', sandboxId }))
    ws.send(JSON.stringify({
      type: 'sandbox:response',
      message: { id: uuid(), text: response.result, timestamp: new Date().toISOString() },
    }))
    return
  }

  const session = await readOne<Session>('sessions', msg.sandboxId)
  if (!session) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'Sandbox session not found' }))
    return
  }

  const response = await resumeSession(session.claudeSessionId, msg.message ?? '')

  ws.send(JSON.stringify({
    type: 'sandbox:response',
    message: { id: uuid(), text: response.result, timestamp: new Date().toISOString() },
  }))
}

const EVAL_PROMPT = `당신은 면접 채점관입니다. 질문과 답변을 받아 빠르게 채점합니다.

반드시 아래 JSON 형식으로만 응답하세요.
{
  "score": 7,
  "feedback": "한 줄 피드백",
  "modelAnswer": "모범답안 2~3문장 요약"
}`

async function handleInterviewEval(ws: WebSocket, msg: ClientMessage) {
  const question = msg.questionForEval ?? ''
  const answer = msg.answerForEval ?? ''

  ws.send(JSON.stringify({ type: 'interview:evaluating' }))

  const prompt = `질문: "${question}"\n답변: "${answer}"\n\n채점해주세요.`
  const response = await startSession(prompt, EVAL_PROMPT)

  ws.send(JSON.stringify({
    type: 'interview:evalResult',
    result: response.result,
  }))
}

async function handleInterviewSummary(ws: WebSocket, msg: ClientMessage) {
  ws.send(JSON.stringify({ type: 'interview:summarizing' }))

  const data = msg.interviewData ?? {}
  const prompt = `면접 결과를 종합 평가해주세요.\n\n${JSON.stringify(data, null, 2)}\n\n3~4문장으로 총평을 작성해주세요. JSON이 아닌 일반 텍스트로 응답하세요.`

  const response = await startSession(prompt, EVAL_PROMPT)

  ws.send(JSON.stringify({
    type: 'interview:summaryResult',
    result: response.result,
  }))
}

async function handleInterviewSave(ws: WebSocket, msg: ClientMessage) {
  const data = msg.interviewData as Record<string, unknown> | undefined
  if (!data) return

  const id = `iv_${uuid().slice(0, 8)}`
  const session: Session = {
    id,
    claudeSessionId: '',
    questionId: '',
    questionText: '',
    mode: data.mode as string ?? 'interview',
    agent: 'interviewer',
    createdAt: new Date().toISOString(),
    ...data,
  }
  await writeOne('sessions', id, session)

  ws.send(JSON.stringify({ type: 'interview:saved', id }))
}

function loadProfile(): ProfileData | null {
  const row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as Record<string, unknown> | undefined
  if (!row) return null
  return {
    jobRole: row.job_role as string ?? 'frontend',
    experienceLevel: row.experience_level as string ?? 'junior',
    techStack: JSON.parse(row.tech_stack as string ?? '[]'),
    interestStack: JSON.parse(row.interest_stack as string ?? '[]'),
    aiTools: JSON.parse(row.ai_tools as string ?? '[]'),
    memo: row.memo as string ?? '',
  }
}

async function handleQuestionsGenerate(ws: WebSocket, msg: ClientMessage) {
  const type = msg.generateType ?? 'both'
  const count = msg.generateCount ?? 5

  ws.send(JSON.stringify({ type: 'questions:generating' }))

  const profile = loadProfile()
  const systemPrompt = buildGeneratorPrompt(profile)

  let prompt: string
  if (type === 'technical') {
    prompt = `프론트엔드 개발자 기술 면접에서 자주 나오는 질문 ${count}개를 웹에서 검색해서 생성해주세요.`
  } else if (type === 'behavioral') {
    prompt = `개발자 인성 면접 질문 ${count}개를 웹에서 검색해서 생성해주세요.`
  } else if (type === 'opinion') {
    prompt = `개발자 의견/철학 면접 질문 ${count}개를 생성해주세요. 기술 선택 이유, 도구 비교, AI 활용 등.`
  } else {
    prompt = `프론트엔드 개발자 면접 질문 ${count}개를 생성해주세요. 기술, 인성, 의견 질문을 골고루 섞어주세요.`
  }

  try {
    const response = await startSession(prompt, systemPrompt)

    ws.send(JSON.stringify({
      type: 'questions:generated',
      result: response.result,
    }))
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Generation failed'
    ws.send(JSON.stringify({ type: 'chat:error', error }))
  }
}
