import type { WebSocket } from '@fastify/websocket'
import { v4 as uuid } from 'uuid'
import { startSession, resumeSession } from '../claude/cli.js'
import { getPromptForAgent, HINT_PROMPT, SANDBOX_PROMPT, buildGeneratorPrompt, type ProfileData } from '../claude/prompts.js'
import { readAll, readOne, writeOne } from '../data/store.js'
import { parseClaudeJson, stripCodeBlock } from '../lib/utils.js'
import type { MessageEntry, HintEntry, StoredSession, ClientMessage, QuestionRecord, UserProfile } from '@escapist/shared'

function tryExtractScore(text: string): number | null {
  const { parsed } = parseClaudeJson<{ score?: number }>(text)
  if (parsed && typeof parsed.score === 'number') return parsed.score
  return null
}

async function updateQuestionScore(questionId: string, score: number): Promise<void> {
  if (!questionId) return
  const question = await readOne<QuestionRecord>('questions', questionId)
  if (!question) return

  const attempts = (question.attempts ?? 0) + 1
  const prevAvg = question.averageScore ?? 0
  const newAvg = prevAvg === 0 ? score : Math.round(((prevAvg * (attempts - 1) + score) / attempts) * 10) / 10
  const bestScore = Math.max(question.bestScore ?? 0, score)

  let status = question.status
  if (bestScore >= 8) status = 'master'
  else if (newAvg < 5) status = 'weak'
  else status = 'learning'

  await writeOne('questions', questionId, {
    ...question,
    bestScore,
    averageScore: newAvg,
    attempts,
    status,
    lastAttemptAt: new Date().toISOString(),
  })
}

function appendMessage(session: StoredSession, msg: MessageEntry): StoredSession {
  session.messages = [...(session.messages ?? []), msg]
  session.lastActivityAt = new Date().toISOString()
  return session
}

export function handleWsConnection(ws: WebSocket) {
  ws.on('message', async (raw: Buffer | string) => {
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
  const rawMessage = msg.message ?? ''
  const isSkip = rawMessage === '__SKIP__'
  const isFollowUpAnswer = rawMessage.startsWith('__FOLLOWUP_ANSWER__')
  const isExplain = rawMessage.startsWith('__EXPLAIN__')

  let userMessage: string
  let claudePrompt: string | null = null

  if (isSkip) {
    userMessage = '모르겠습니다.'
    claudePrompt = '사용자가 이 질문에 답변하지 못했습니다. 핵심 개념을 쉽게 설명해주고, 이해를 확인하는 질문을 해주세요.'
  } else if (isFollowUpAnswer) {
    const parts = rawMessage.replace('__FOLLOWUP_ANSWER__', '').split('__SEP__')
    const followUpQ = parts[0] ?? ''
    const answer = parts[1] ?? ''
    userMessage = answer
    claudePrompt = `면접관이 꼬리질문을 했습니다: "${followUpQ}"\n\n사용자의 답변: ${answer}\n\n위 답변을 평가해주세요.`
  } else if (isExplain) {
    const followUpQ = rawMessage.replace('__EXPLAIN__', '')
    userMessage = `"${followUpQ}"에 대한 모범답변을 알려주세요.`
    claudePrompt = `면접관이 꼬리질문을 했습니다: "${followUpQ}"\n\n사용자가 모범답변을 요청했습니다. 이 질문에 대한 모범답변을 상세하게 설명해주세요.`
  } else {
    userMessage = rawMessage
  }

  // 세션이 없으면 새로 생성 (첫 답변)
  if (!msg.sessionId) {
    const questionText = msg.questionText ?? ''
    const systemPrompt = getPromptForAgent(agent, msg.interviewType)
    const prompt = claudePrompt
      ?? `면접 질문: "${questionText}"\n\n사용자의 답변: ${userMessage}\n\n위 답변을 평가해주세요.`

    ws.send(JSON.stringify({ type: 'chat:typing', agent }))

    const response = await startSession(prompt, systemPrompt)

    const sessionId = `s_${uuid().slice(0, 8)}`
    const now = new Date().toISOString()

    // user 메시지 + assistant 메시지 저장
    const userMsg: MessageEntry = { id: uuid(), role: isSkip ? 'skip' : 'user', text: isSkip ? '모르겠다' : (msg.message ?? ''), timestamp: now }
    const assistantMsg: MessageEntry = { id: uuid(), role: agent, agent, text: response.result, timestamp: now }

    const session: StoredSession = {
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
    if (score !== null) await updateQuestionScore(msg.questionId ?? '', score)

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
  const session = await readOne<StoredSession>('sessions', msg.sessionId)
  if (!session) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'Session not found' }))
    return
  }

  // user 메시지 저장
  const now = new Date().toISOString()
  const msgRole = isSkip ? 'skip' : isExplain ? 'system' : 'user'
  const msgText = isSkip ? '모르겠다' : isExplain ? '모범답변 요청' : userMessage
  const userMsg: MessageEntry = { id: uuid(), role: msgRole, text: msgText, timestamp: now }
  appendMessage(session, userMsg)

  ws.send(JSON.stringify({ type: 'chat:typing', agent }))

  const resumePrompt = claudePrompt ?? userMessage
  const response = await resumeSession(session.claudeSessionId, resumePrompt)

  // assistant 메시지 저장
  const assistantMsg: MessageEntry = { id: uuid(), role: agent, agent, text: response.result, timestamp: now }
  appendMessage(session, assistantMsg)
  await writeOne('sessions', session.id, session)

  // 질문 점수 업데이트
  const score = tryExtractScore(response.result)
  if (score !== null) await updateQuestionScore(session.questionId, score)

  ws.send(JSON.stringify({
    type: 'chat:response',
    message: assistantMsg,
  }))
}

async function handleSessionLoad(ws: WebSocket, msg: ClientMessage) {
  if (!msg.sessionId) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'sessionId is required' }))
    return
  }

  const session = await readOne<StoredSession>('sessions', msg.sessionId)
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
  let hintData = await readOne<StoredSession>('sessions', hintDataId)

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
  const hintData = await readOne<StoredSession>('sessions', hintDataId)

  ws.send(JSON.stringify({
    type: 'hint:loaded',
    questionId,
    hints: hintData?.hints ?? [],
  }))
}

async function handleSandboxSend(ws: WebSocket, msg: ClientMessage) {
  ws.send(JSON.stringify({ type: 'sandbox:typing' }))

  if (!msg.sandboxId) {
    const userText = msg.message ?? ''
    const response = await startSession(userText, SANDBOX_PROMPT)

    const sandboxId = `sb_${uuid().slice(0, 8)}`
    const now = new Date().toISOString()
    const userMsg: MessageEntry = { id: uuid(), role: 'user', text: userText, timestamp: now }
    const assistantMsg: MessageEntry = { id: uuid(), role: 'assistant', text: response.result, timestamp: now }

    const session: StoredSession = {
      id: sandboxId,
      claudeSessionId: response.sessionId,
      questionId: '',
      questionText: userText.slice(0, 30),
      mode: 'sandbox',
      agent: 'tutor',
      messages: [userMsg, assistantMsg],
      createdAt: now,
      lastActivityAt: now,
    }
    await writeOne('sessions', sandboxId, session)

    ws.send(JSON.stringify({ type: 'sandbox:created', sandboxId }))
    ws.send(JSON.stringify({
      type: 'sandbox:response',
      message: { id: assistantMsg.id, text: response.result, timestamp: now },
    }))
    return
  }

  const session = await readOne<StoredSession>('sessions', msg.sandboxId)
  if (!session) {
    ws.send(JSON.stringify({ type: 'chat:error', error: 'Sandbox session not found' }))
    return
  }

  const now = new Date().toISOString()
  const userMsg: MessageEntry = { id: uuid(), role: 'user', text: msg.message ?? '', timestamp: now }
  appendMessage(session, userMsg)

  const response = await resumeSession(session.claudeSessionId, msg.message ?? '')

  const assistantMsg: MessageEntry = { id: uuid(), role: 'assistant', text: response.result, timestamp: now }
  appendMessage(session, assistantMsg)
  await writeOne('sessions', session.id, session)

  ws.send(JSON.stringify({
    type: 'sandbox:response',
    message: { id: assistantMsg.id, text: response.result, timestamp: now },
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
    result: stripCodeBlock(response.result),
  }))
}

async function handleInterviewSummary(ws: WebSocket, msg: ClientMessage) {
  ws.send(JSON.stringify({ type: 'interview:summarizing' }))

  const data = msg.interviewData ?? {}
  const prompt = `면접 결과를 종합 평가해주세요.\n\n${JSON.stringify(data, null, 2)}\n\n3~4문장으로 총평을 작성해주세요. JSON이 아닌 일반 텍스트로 응답하세요.`

  const response = await startSession(prompt, EVAL_PROMPT)

  ws.send(JSON.stringify({
    type: 'interview:summaryResult',
    result: stripCodeBlock(response.result),
  }))
}

const INTERVIEW_SAVE_FIELDS = ['questions', 'answers', 'scores', 'summary', 'mode', 'categories', 'questionText'] as const

async function handleInterviewSave(ws: WebSocket, msg: ClientMessage) {
  const data = msg.interviewData as Record<string, unknown> | undefined
  if (!data) return

  const picked: Record<string, unknown> = {}
  for (const key of INTERVIEW_SAVE_FIELDS) {
    if (key in data) picked[key] = data[key]
  }

  const id = `iv_${uuid().slice(0, 8)}`
  const session: StoredSession = {
    id,
    claudeSessionId: '',
    questionId: '',
    questionText: '',
    mode: typeof picked.mode === 'string' ? picked.mode : 'interview',
    agent: 'interviewer',
    createdAt: new Date().toISOString(),
    ...picked,
  }
  await writeOne('sessions', id, session)

  ws.send(JSON.stringify({ type: 'interview:saved', id }))
}

async function loadProfile(): Promise<ProfileData | null> {
  const profile = await readOne<UserProfile>('user_profile', '1')
  if (!profile) return null
  return {
    jobRole: profile.jobRole ?? 'frontend',
    experienceLevel: profile.experienceLevel ?? 'junior',
    techStack: profile.techStack ?? [],
    interestStack: profile.interestStack ?? [],
    aiTools: profile.aiTools ?? [],
    memo: profile.memo ?? '',
  }
}

async function handleQuestionsGenerate(ws: WebSocket, msg: ClientMessage) {
  const type = msg.generateType ?? 'both'
  const count = msg.generateCount ?? 5

  ws.send(JSON.stringify({ type: 'questions:generating' }))

  const profile = await loadProfile()
  const systemPrompt = buildGeneratorPrompt(profile)

  // 기존 질문 목록 로드 → 중복 방지
  const existingQuestions = await readAll<{ question: string }>('questions')
  const existingList = existingQuestions.map((q) => q.question)
  const dedupeClause = existingList.length > 0
    ? `\n\n## 이미 등록된 질문 (중복 금지)\n${existingList.map((q) => `- ${q}`).join('\n')}\n\n위 질문과 동일하거나 매우 유사한 질문은 절대 생성하지 마세요.`
    : ''

  let prompt: string
  if (type === 'technical') {
    prompt = `프론트엔드 개발자 기술 면접에서 자주 나오는 질문 ${count}개를 웹에서 검색해서 생성해주세요.${dedupeClause}`
  } else if (type === 'behavioral') {
    prompt = `개발자 인성 면접 질문 ${count}개를 웹에서 검색해서 생성해주세요.${dedupeClause}`
  } else if (type === 'opinion') {
    prompt = `개발자 의견/철학 면접 질문 ${count}개를 생성해주세요. 기술 선택 이유, 도구 비교, AI 활용 등.${dedupeClause}`
  } else {
    prompt = `프론트엔드 개발자 면접 질문 ${count}개를 생성해주세요. 기술, 인성, 의견 질문을 골고루 섞어주세요.${dedupeClause}`
  }

  try {
    const response = await startSession(prompt, systemPrompt)

    ws.send(JSON.stringify({
      type: 'questions:generated',
      result: stripCodeBlock(response.result),
    }))
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Generation failed'
    ws.send(JSON.stringify({ type: 'chat:error', error }))
  }
}
