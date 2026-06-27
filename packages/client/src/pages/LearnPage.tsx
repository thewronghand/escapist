import { useState, useRef, useEffect } from 'react'
import type { Question, ChatMessage, Evaluation, FollowUpNode, SessionSummary } from '@/types'
import type { AgentId } from '@/types'
import { useQuestions } from '@/hooks/useQuestions'
import { useHints } from '@/hooks/useHints'
import { QuestionSelect } from '@/components/learn/QuestionSelect'
import { QuestionFormModal } from '@/components/learn/QuestionFormModal'
import { QuestionGenerateModal } from '@/components/learn/QuestionGenerateModal'
import { LearnSidebar } from '@/components/learn/LearnSidebar'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { EvaluationCard } from '@/components/chat/EvaluationCard'
import { FollowUpButtons } from '@/components/chat/FollowUpButtons'
import { HintPopover } from '@/components/chat/HintPopover'
import { FollowUpTree } from '@/components/chat/FollowUpTree'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { DifficultyStars } from '@/components/ui/DifficultyStars'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { parseClaudeJson } from '@/lib/utils'
import { AGENTS } from '@/types'

interface LearnPageProps {
  chat: {
    messages: ChatMessage[]
    typing: boolean
    sessionId: string | null
    agent: AgentId
    setAgent: (a: AgentId) => void
    startChat: (questionId: string, questionText: string) => void
    loadSession: (id: string) => void
    sendMessage: (text: string, agentOverride?: AgentId) => void
    addLocalMessage: (msg: ChatMessage) => void
    activeQuestion: { id: string; text: string } | null
  }
  sessions: SessionSummary[]
  view: 'select' | 'session'
  setView: (v: 'select' | 'session') => void
  onSessionCreated: () => void
}

export function LearnPage({ chat, sessions, view, setView, onSessionCreated }: LearnPageProps) {
  const { questions, add, reload: reloadQuestions } = useQuestions()
  const hints = useHints()
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [mobileTab, setMobileTab] = useState<'questions' | 'sessions'>('questions')
  const [followUps, setFollowUps] = useState<string[]>([])
  const [treeOpen, setTreeOpen] = useState(false)
  const [treeRoot, setTreeRoot] = useState<FollowUpNode | null>(null)
  const [currentTreeNodeId, setCurrentTreeNodeId] = useState<string>('root')
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const treeRootRef = useRef(treeRoot)
  const currentTreeNodeIdRef = useRef(currentTreeNodeId)
  treeRootRef.current = treeRoot
  currentTreeNodeIdRef.current = currentTreeNodeId

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chat.messages, chat.typing])

  // 세션이 로드되면 (resume) activeQuestion 동기화
  useEffect(() => {
    if (chat.activeQuestion && view === 'session' && !activeQuestion) {
      const q = questions.find((q) => q.id === chat.activeQuestion?.id)
      if (q) setActiveQuestion(q)
    }
  }, [chat.activeQuestion, view, activeQuestion, questions])

  // 세션 생성 시 사이드바 목록 갱신
  useEffect(() => {
    if (chat.sessionId) {
      onSessionCreated()
    }
  }, [chat.sessionId, onSessionCreated])

  const handleSelectQuestion = (q: Question) => {
    setActiveQuestion(q)
    setView('session')
    setFollowUps([])
    setTreeRoot({
      id: 'root',
      question: q.question,
      status: 'current',
      children: [],
    })
    setCurrentTreeNodeId('root')
    setTreeOpen(false)

    // 기존 세션이 있으면 로드, 없으면 새 세션
    const existingSession = sessions.find((s) => s.questionId === q.id)
    if (existingSession) {
      chat.loadSession(existingSession.id)
    } else {
      chat.startChat(q.id, q.question)
    }
    hints.initForQuestion(q.id, q.question)
  }

  const handleSend = (text: string) => {
    if (pendingFollowUp) {
      // 꼬리질문에 대한 답변 — 프롬프트에 컨텍스트 포함
      chat.sendMessage(`__FOLLOWUP_ANSWER__${pendingFollowUp}__SEP__${text}`)
      setPendingFollowUp(null)
    } else {
      chat.sendMessage(text)
    }
    setFollowUps([])
  }

  const handleSkip = () => {
    chat.sendMessage('__SKIP__')
    setFollowUps([])
  }

  const handleFollowUp = (question: string) => {
    // 트리에 새 노드 추가
    if (treeRoot) {
      const newNodeId = `node_${Date.now()}`
      const addChild = (node: FollowUpNode): FollowUpNode => {
        if (node.id === currentTreeNodeId) {
          return {
            ...node,
            status: 'answered',
            children: [...node.children, {
              id: newNodeId,
              question,
              status: 'current',
              children: [],
            }],
          }
        }
        return { ...node, children: node.children.map(addChild) }
      }
      setTreeRoot(addChild(treeRoot))
      setCurrentTreeNodeId(newNodeId)
    }

    // 면접관 메시지로 로컬 추가 (Claude 호출 없음, 답변 대기)
    chat.addLocalMessage({
      id: crypto.randomUUID(),
      role: 'interviewer',
      text: question,
      timestamp: new Date().toISOString(),
    })
    setPendingFollowUp(question)
    setFollowUps([])
  }

  const handleFollowUpExplain = (question: string) => {
    // 면접관 메시지로 표시 + 모범답변 즉시 요청
    chat.addLocalMessage({
      id: crypto.randomUUID(),
      role: 'interviewer',
      text: question,
      timestamp: new Date().toISOString(),
    })
    chat.sendMessage(`__EXPLAIN__${question}`)
    setFollowUps([])
  }

  const handleBack = () => {
    setView('select')
    setActiveQuestion(null)
  }

  interface ExplanationResponse {
    type: 'explanation'
    content: string
    checkQuestion: string
  }

  function isEvaluation(v: Record<string, unknown>): v is Record<string, unknown> & Evaluation {
    return v.type === 'evaluation' && typeof v.score === 'number' && typeof v.feedback === 'string'
  }

  function isExplanation(v: Record<string, unknown>): v is Record<string, unknown> & ExplanationResponse {
    return v.type === 'explanation' && typeof v.content === 'string' && typeof v.checkQuestion === 'string'
  }

  const parseResponse = (text: string): { evaluation?: Evaluation; explanation?: ExplanationResponse } => {
    const { parsed } = parseClaudeJson<Record<string, unknown>>(text)
    if (!parsed) return {}
    if (isEvaluation(parsed)) return { evaluation: parsed }
    if (isExplanation(parsed)) return { explanation: parsed }
    return {}
  }

  const parseEvaluation = (text: string): Evaluation | null => {
    const { evaluation } = parseResponse(text)
    return evaluation ?? null
  }

  // 최신 메시지에서 evaluation 추출 → followUps/treeRoot 업데이트 (렌더 밖에서)
  const lastMessage = chat.messages[chat.messages.length - 1]
  const lastEvaluation = lastMessage && lastMessage.role !== 'user'
    ? parseEvaluation(lastMessage.text)
    : null

  useEffect(() => {
    if (!lastEvaluation) return
    if (lastEvaluation.followUpQuestions?.length && followUps.length === 0) {
      setFollowUps(lastEvaluation.followUpQuestions)
    }
    if (treeRootRef.current && lastEvaluation.score != null) {
      const nodeId = currentTreeNodeIdRef.current
      const updateScore = (node: FollowUpNode): FollowUpNode => {
        if (node.id === nodeId) {
          return { ...node, score: lastEvaluation.score, status: 'answered' }
        }
        return { ...node, children: node.children.map(updateScore) }
      }
      setTreeRoot(updateScore(treeRootRef.current))
    }
  }, [lastMessage?.id])

  const renderMessage = (msg: ChatMessage) => {
    if (msg.role === 'user') {
      return <ChatBubble key={msg.id} message={msg} />
    }

    const { evaluation, explanation } = parseResponse(msg.text)

    if (evaluation) {
      return (
        <div key={msg.id}>
          <ChatBubble message={{ ...msg, text: evaluation.feedback }} />
          <div className="mt-3 max-w-[80%]">
            <EvaluationCard evaluation={evaluation} />
          </div>
        </div>
      )
    }

    if (explanation) {
      return (
        <div key={msg.id}>
          <ChatBubble message={{ ...msg, text: explanation.content }} />
          {explanation.checkQuestion && (
            <div className="mt-2 max-w-[80%] px-4 py-3 bg-surface border border-hairline rounded-lg">
              <p className="text-[11px] text-accent-blue uppercase tracking-wider mb-1">이해 확인 질문</p>
              <p className="text-[14px] text-body">{explanation.checkQuestion}</p>
            </div>
          )}
        </div>
      )
    }

    return <ChatBubble key={msg.id} message={msg} />
  }

  const handleSelectSession = (id: string) => {
    chat.loadSession(id)
    setView('session')
  }

  if (view === 'select') {
    return (
      <>
        {/* 탭 — 세션/질문 전환 */}
        <div className="flex border-b border-hairline">
          <button
            onClick={() => setMobileTab('questions')}
            className={`flex-1 py-3 text-[13px] font-medium text-center transition-colors ${
              mobileTab === 'questions' ? 'text-ink border-b-2 border-ink' : 'text-mute'
            }`}
          >
            질문 목록
          </button>
          <button
            onClick={() => setMobileTab('sessions')}
            className={`flex-1 py-3 text-[13px] font-medium text-center transition-colors ${
              mobileTab === 'sessions' ? 'text-ink border-b-2 border-ink' : 'text-mute'
            }`}
          >
            세션 ({sessions.length})
          </button>
        </div>

        {/* 세션 목록 */}
        {mobileTab === 'sessions' && (
          <div className="flex-1 overflow-auto">
            <LearnSidebar
              sessions={sessions}
              activeSessionId={chat.sessionId}
              onSelectSession={handleSelectSession}
              onNewSession={() => setMobileTab('questions')}
            />
          </div>
        )}

        {/* 질문 목록 (데스크톱은 항상, 모바일은 탭 선택 시) */}
        <div className={mobileTab === 'sessions' ? 'hidden' : 'flex-1'}>
          <QuestionSelect
            questions={questions}
            onSelect={handleSelectQuestion}
            onAddNew={() => setShowForm(true)}
            onAutoGenerate={() => setShowGenerate(true)}
          />
        </div>

        <QuestionFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => add(data)}
        />
        <QuestionGenerateModal
          open={showGenerate}
          onClose={() => setShowGenerate(false)}
          onSaved={reloadQuestions}
        />
      </>
    )
  }

  const agentInfo = AGENTS.find((a) => a.id === chat.agent)
  const displayQuestion = activeQuestion?.question ?? chat.activeQuestion?.text ?? ''
  const displayCategory = activeQuestion?.category
  const displayDifficulty = activeQuestion?.difficulty

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="shrink-0 border-b border-hairline px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-ash hover:text-body transition-colors">
            <Icon name="chevleft" size={18} />
          </button>
          <div>
            <p className="text-ink text-[15px] font-medium">{displayQuestion}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {displayCategory && <CategoryTag category={displayCategory} />}
              {displayDifficulty && <DifficultyStars value={displayDifficulty} size={10} />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {treeRoot && treeRoot.children.length > 0 && (
            <Button
              variant={treeOpen ? 'tertiary' : 'secondary'}
              size="sm"
              icon="diagram"
              onClick={() => setTreeOpen(!treeOpen)}
            >
              트리
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleBack}>세션 종료</Button>
        </div>
      </div>

      {/* Chat + Tree */}
      <div className="flex-1 flex min-h-0">
        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div className="max-w-[820px] mx-auto px-5 py-6 flex flex-col gap-5">
            {chat.messages.map(renderMessage)}
            {chat.typing && <TypingIndicator agent={agentInfo?.name} />}
            {followUps.length > 0 && !chat.typing && (
              <FollowUpButtons questions={followUps} onSelect={handleFollowUp} onExplain={handleFollowUpExplain} />
            )}
          </div>
        </div>

        {/* Tree Panel */}
        {treeOpen && treeRoot && (
          <div
            className="w-[380px] shrink-0 border-l border-hairline bg-surface"
            style={{ animation: 'esc-slide-left 0.25s ease both' }}
          >
            <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
              <span className="text-[13px] text-ink font-medium">꼬리질문 트리</span>
              <button onClick={() => setTreeOpen(false)} className="text-ash hover:text-body">
                <Icon name="x" size={14} />
              </button>
            </div>
            <div className="h-[calc(100%-44px)]">
              <FollowUpTree tree={treeRoot} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onSkip={handleSkip}
        disabled={chat.typing}
        agent={chat.agent}
        onAgentChange={chat.setAgent}
        hintSlot={
          <HintPopover
            hints={hints.hints}
            loading={hints.loading}
            canRequestMore={hints.canRequestMore}
            remainingHints={hints.remainingHints}
            onRequestHint={hints.requestHint}
            disabled={chat.typing}
          />
        }
      />
    </div>
  )
}
