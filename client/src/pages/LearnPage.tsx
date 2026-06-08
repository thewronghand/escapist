import { useState, useRef, useEffect } from 'react'
import type { Question, ChatMessage, Evaluation } from '@/types'
import { useQuestions } from '@/hooks/useQuestions'
import { useChat } from '@/hooks/useChat'
import { useHints } from '@/hooks/useHints'
import { QuestionSelect } from '@/components/learn/QuestionSelect'
import { QuestionFormModal } from '@/components/learn/QuestionFormModal'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { EvaluationCard } from '@/components/chat/EvaluationCard'
import { FollowUpButtons } from '@/components/chat/FollowUpButtons'
import { HintPopover } from '@/components/chat/HintPopover'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { DifficultyStars } from '@/components/ui/DifficultyStars'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { parseClaudeJson } from '@/lib/utils'
import { AGENTS } from '@/types'

type View = 'select' | 'session'

export function LearnPage() {
  const { questions, add } = useQuestions()
  const chat = useChat()
  const hints = useHints()
  const [view, setView] = useState<View>('select')
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [followUps, setFollowUps] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chat.messages, chat.typing])

  const handleSelectQuestion = (q: Question) => {
    setActiveQuestion(q)
    setView('session')
    setFollowUps([])
    chat.startChat(q.id, q.question)
    hints.initForQuestion(q.id, q.question)
  }

  const handleSend = (text: string) => {
    chat.sendMessage(text)
    setFollowUps([])
  }

  const handleSkip = () => {
    chat.sendMessage('모르겠다')
    setFollowUps([])
  }

  const handleFollowUp = (question: string) => {
    chat.sendMessage(question)
    setFollowUps([])
  }

  const handleBack = () => {
    setView('select')
    setActiveQuestion(null)
  }

  const parseEvaluation = (text: string): Evaluation | null => {
    const { parsed } = parseClaudeJson<Evaluation & { type?: string }>(text)
    if (parsed?.type === 'evaluation') return parsed
    return null
  }

  const renderMessage = (msg: ChatMessage) => {
    if (msg.role === 'user') {
      return <ChatBubble key={msg.id} message={msg} />
    }

    const evaluation = parseEvaluation(msg.text)
    if (evaluation) {
      if (evaluation.followUpQuestions?.length && followUps.length === 0) {
        setFollowUps(evaluation.followUpQuestions)
      }
      return (
        <div key={msg.id}>
          <ChatBubble message={{ ...msg, text: evaluation.feedback }} />
          <div className="mt-3 max-w-[80%]">
            <EvaluationCard evaluation={evaluation} />
          </div>
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
        />
        <QuestionFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => add(data)}
        />
      </>
    )
  }

  const agentInfo = AGENTS.find((a) => a.id === chat.agent)

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="shrink-0 border-b border-hairline px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-ash hover:text-body transition-colors">
            <Icon name="chevleft" size={18} />
          </button>
          <div>
            <p className="text-ink text-[15px] font-medium">{activeQuestion?.question}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {activeQuestion && <CategoryTag category={activeQuestion.category} />}
              {activeQuestion && <DifficultyStars value={activeQuestion.difficulty} size={10} />}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleBack}>세션 종료</Button>
      </div>

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

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onSkip={handleSkip}
        disabled={chat.typing}
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
