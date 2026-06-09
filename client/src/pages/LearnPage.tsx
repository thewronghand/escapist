import { useState, useRef, useEffect } from 'react'
import type { Question, ChatMessage, Evaluation, FollowUpNode, SessionSummary } from '@/types'
import type { AgentId } from '@/types'
import { useQuestions } from '@/hooks/useQuestions'
import { useHints } from '@/hooks/useHints'
import { QuestionSelect } from '@/components/learn/QuestionSelect'
import { QuestionFormModal } from '@/components/learn/QuestionFormModal'
import { QuestionGenerateModal } from '@/components/learn/QuestionGenerateModal'
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
  const [followUps, setFollowUps] = useState<string[]>([])
  const [treeOpen, setTreeOpen] = useState(false)
  const [treeRoot, setTreeRoot] = useState<FollowUpNode | null>(null)
  const [currentTreeNodeId, setCurrentTreeNodeId] = useState<string>('root')
  const scrollRef = useRef<HTMLDivElement>(null)

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
    chat.sendMessage(text)
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

    chat.sendMessage(question)
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

  const parseResponse = (text: string): { evaluation?: Evaluation; explanation?: ExplanationResponse } => {
    const { parsed } = parseClaudeJson<Record<string, unknown>>(text)
    if (!parsed) return {}
    if (parsed.type === 'evaluation') return { evaluation: parsed as unknown as Evaluation }
    if (parsed.type === 'explanation') return { explanation: parsed as unknown as ExplanationResponse }
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
    if (treeRoot && lastEvaluation.score != null) {
      const updateScore = (node: FollowUpNode): FollowUpNode => {
        if (node.id === currentTreeNodeId) {
          return { ...node, score: lastEvaluation.score, status: 'answered' }
        }
        return { ...node, children: node.children.map(updateScore) }
      }
      setTreeRoot(updateScore(treeRoot))
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

  if (view === 'select') {
    return (
      <>
        <QuestionSelect
          questions={questions}
          onSelect={handleSelectQuestion}
          onAddNew={() => setShowForm(true)}
          onAutoGenerate={() => setShowGenerate(true)}
        />
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
              <FollowUpButtons questions={followUps} onSelect={handleFollowUp} />
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
