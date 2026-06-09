import { useState, useRef, useCallback, useEffect } from 'react'
import type { Question } from '@/types'
import type { EvalResult, InterviewItem } from '@/hooks/useInterview'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

interface EndlessProgressProps {
  questions: Question[]
  threshold: number
  evaluating: boolean
  lastEval: EvalResult | null
  onEvaluate: (question: string, answer: string) => void
  onGameOver: (result: EndlessResult) => void
}

export interface EndlessResult {
  streak: number
  totalAnswered: number
  averageScore: number
  cleared: boolean
  history: InterviewItem[]
  last?: InterviewItem
}

export function EndlessProgress({
  questions,
  threshold,
  evaluating,
  lastEval,
  onEvaluate,
  onGameOver,
}: EndlessProgressProps) {
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [streak, setStreak] = useState(0)
  const [bump, setBump] = useState(false)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<{ score: number; survived: boolean } | null>(null)
  const scores = useRef<number[]>([])
  const history = useRef<InterviewItem[]>([])

  const q = questions[idx]
  const remaining = questions.length - idx
  const avg = scores.current.length > 0
    ? Math.round(scores.current.reduce((a, b) => a + b, 0) / scores.current.length * 10) / 10
    : 0

  useEffect(() => {
    if (!lastEval) return

    const survived = lastEval.score > threshold
    scores.current.push(lastEval.score)

    const item: InterviewItem = {
      questionId: q.id,
      question: q.question,
      category: q.category,
      answer: answer || null,
      score: lastEval.score,
      status: survived ? (lastEval.score >= 7 ? 'correct' : 'partial') : 'wrong',
      feedback: lastEval.feedback,
      modelAnswer: lastEval.modelAnswer,
      timeTaken: 0,
    }
    history.current.push(item)

    setFlash({ score: lastEval.score, survived })

    if (survived) {
      setStreak((s) => s + 1)
      setBump(true)
      setTimeout(() => setBump(false), 400)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }

    setTimeout(() => {
      setFlash(null)
      if (!survived) {
        onGameOver({
          streak,
          totalAnswered: scores.current.length,
          averageScore: Math.round(scores.current.reduce((a, b) => a + b, 0) / scores.current.length * 10) / 10,
          cleared: false,
          history: history.current,
          last: item,
        })
        return
      }
      if (idx + 1 >= questions.length) {
        onGameOver({
          streak: streak + 1,
          totalAnswered: scores.current.length,
          averageScore: Math.round(scores.current.reduce((a, b) => a + b, 0) / scores.current.length * 10) / 10,
          cleared: true,
          history: history.current,
        })
        return
      }
      setIdx(idx + 1)
      setAnswer('')
    }, 1600)
  }, [lastEval])

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || evaluating || flash) return
    onEvaluate(q.question, answer.trim())
  }, [answer, evaluating, flash, q, onEvaluate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* HUD */}
      <div className="shrink-0 border-b border-hairline px-5 py-3 flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <Icon name="flame" size={16} stroke="var(--accent-red)" />
          <span
            className="text-ink text-[18px] font-bold tabular-nums"
            style={bump ? { animation: 'esc-streak-bump 0.4s ease' } : undefined}
          >
            {streak}
          </span>
        </div>
        <div className="text-[13px] text-mute">{scores.current.length}문제 완료</div>
        <div className="text-[13px] text-mute">{remaining}문제 남음</div>
        <div className="text-[13px] text-mute">평균 {avg}</div>
      </div>

      {/* 질문 */}
      <div
        className="flex-1 flex items-center justify-center px-8"
        style={shake ? { animation: 'esc-shake 0.4s ease' } : undefined}
      >
        {flash ? (
          <div className="text-center" style={{ animation: 'esc-pop 0.4s ease both' }}>
            <ScoreRing score={flash.score} size={92} />
            <p className={`text-[16px] font-medium mt-3 ${flash.survived ? 'text-accent-green' : 'text-accent-red'}`}>
              {flash.survived ? `통과! 스트릭 ${streak + 1}` : '게임 오버'}
            </p>
          </div>
        ) : (
          <div className="max-w-[640px] w-full" key={idx} style={{ animation: 'esc-rise 0.3s ease both' }}>
            <div className="flex items-center gap-2 mb-3">
              <CategoryTag category={q.category} />
            </div>
            <h2 className="text-ink text-[22px] font-semibold mb-6">{q.question}</h2>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={evaluating}
              placeholder="답변을 입력하세요..."
              rows={5}
              className="w-full bg-surface-elevated border border-hairline rounded-lg px-4 py-3 text-[14px] text-body placeholder-stone resize-y focus:outline-none focus:border-hairline-strong"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={evaluating || !answer.trim()}>
                {evaluating ? '채점 중...' : '제출'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
