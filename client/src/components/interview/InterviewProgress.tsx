import { useState, useEffect, useRef, useCallback } from 'react'
import type { Question } from '@/types'
import type { EvalResult, InterviewItem } from '@/hooks/useInterview'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { DifficultyStars } from '@/components/ui/DifficultyStars'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Button } from '@/components/ui/Button'

interface InterviewProgressProps {
  questions: Question[]
  timeLimit: number | null
  evaluating: boolean
  lastEval: EvalResult | null
  onEvaluate: (question: string, answer: string) => void
  onFinish: (items: InterviewItem[]) => void
  onAbort: () => void
}

export function InterviewProgress({
  questions,
  timeLimit,
  evaluating,
  lastEval,
  onEvaluate,
  onFinish,
  onAbort,
}: InterviewProgressProps) {
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [flash, setFlash] = useState<EvalResult | null>(null)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const results = useRef<InterviewItem[]>([])
  const startTime = useRef(Date.now())

  const q = questions[idx]

  // 타이머
  useEffect(() => {
    if (timeLimit == null) return
    setTimeLeft(timeLimit)
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(interval)
          commit(null, true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [idx, timeLimit])

  // 채점 결과 수신
  useEffect(() => {
    if (!lastEval) return
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
    const status = lastEval.score >= 7 ? 'correct' : lastEval.score >= 5 ? 'partial' : 'wrong'

    results.current.push({
      questionId: q.id,
      question: q.question,
      category: q.category,
      answer: answer || null,
      score: lastEval.score,
      status,
      feedback: lastEval.feedback,
      modelAnswer: lastEval.modelAnswer,
      timeTaken,
    })

    setFlash(lastEval)
    setTimeout(() => {
      setFlash(null)
      if (idx + 1 >= questions.length) {
        onFinish(results.current)
      } else {
        setIdx(idx + 1)
        setAnswer('')
        startTime.current = Date.now()
      }
    }, 1600)
  }, [lastEval])

  const commit = useCallback((text: string | null, timedOut = false) => {
    if (timedOut || text === null) {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
      results.current.push({
        questionId: q.id,
        question: q.question,
        category: q.category,
        answer: null,
        score: 0,
        status: timedOut ? 'timeout' : 'pass',
        feedback: timedOut ? '시간 초과' : '패스',
        modelAnswer: '',
        timeTaken,
      })

      setFlash({ score: 0, feedback: timedOut ? '시간 초과' : '패스', modelAnswer: '' })
      setTimeout(() => {
        setFlash(null)
        if (idx + 1 >= questions.length) {
          onFinish(results.current)
        } else {
          setIdx(idx + 1)
          setAnswer('')
          startTime.current = Date.now()
        }
      }, 1600)
      return
    }

    onEvaluate(q.question, text)
  }, [idx, q, questions.length, onEvaluate, onFinish])

  const handleSubmit = () => {
    if (!answer.trim() || evaluating || flash) return
    commit(answer.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const pct = ((idx) / questions.length) * 100

  return (
    <div className="h-full flex flex-col">
      {/* HUD */}
      <div className="shrink-0 border-b border-hairline px-5 py-3 flex items-center gap-4">
        <span className="text-ink text-[14px] font-medium">{idx + 1} / {questions.length}</span>
        <div className="flex-1 h-1.5 rounded-full bg-surface-card">
          <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        {timeLeft != null && (
          <span className={`text-[14px] font-mono tabular-nums ${timeLeft <= 30 ? 'text-accent-red' : 'text-mute'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={onAbort}>중단</Button>
      </div>

      {/* 질문 */}
      <div className="flex-1 flex items-center justify-center px-8">
        {flash ? (
          <div className="text-center" style={{ animation: 'esc-pop 0.4s ease both' }}>
            <ScoreRing score={flash.score} size={92} label={flash.score === 0 ? flash.feedback : undefined} />
          </div>
        ) : (
          <div className="max-w-[640px] w-full">
            <div className="flex items-center gap-2 mb-3">
              <CategoryTag category={q.category} />
              <DifficultyStars value={q.difficulty} size={12} />
            </div>
            <h2 className="text-ink text-[22px] font-semibold mb-6">{q.question}</h2>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={evaluating}
              placeholder="답변을 입력하세요..."
              rows={6}
              className="w-full bg-surface-elevated border border-hairline rounded-lg px-4 py-3 text-[14px] text-body placeholder-stone resize-y focus:outline-none focus:border-hairline-strong"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="tertiary" size="sm" onClick={() => commit(null)} disabled={evaluating}>
                모르겠다 (패스)
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={evaluating || !answer.trim()}>
                {evaluating ? '채점 중...' : '제출'}
              </Button>
            </div>
            <p className="text-[11px] text-stone text-right mt-1">⌘/Ctrl + Enter로 제출</p>
          </div>
        )}
      </div>
    </div>
  )
}
