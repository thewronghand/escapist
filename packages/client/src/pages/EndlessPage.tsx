import { useState, useCallback } from 'react'
import type { Question } from '@/types'
import { useQuestions } from '@/hooks/useQuestions'
import { useInterview } from '@/hooks/useInterview'
import { EndlessStart, type EndlessSettings } from '@/components/endless/EndlessStart'
import { EndlessProgress, type EndlessResult } from '@/components/endless/EndlessProgress'
import { GameOverScreen } from '@/components/endless/GameOverScreen'

type Phase = 'start' | 'progress' | 'over'

interface EndlessPageProps {
  onNavigate?: (nav: string) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function EndlessPage({ onNavigate }: EndlessPageProps) {
  const { questions } = useQuestions()
  const interview = useInterview()
  const [phase, setPhase] = useState<Phase>('start')
  const [pool, setPool] = useState<Question[]>([])
  const [threshold, setThreshold] = useState(4)
  const [result, setResult] = useState<EndlessResult | null>(null)
  const [bestStreak, setBestStreak] = useState(0)

  const handleStart = useCallback((settings: EndlessSettings) => {
    let filtered = [...questions]
    if (settings.categories.length > 0) {
      filtered = filtered.filter((q) => settings.categories.includes(q.category))
    }
    if (filtered.length === 0) return

    setPool(shuffle(filtered))
    setThreshold(settings.gameOverThreshold)
    setPhase('progress')
  }, [questions])

  const handleGameOver = useCallback((r: EndlessResult) => {
    setResult(r)
    if (r.streak > bestStreak) setBestStreak(r.streak)
    setPhase('over')

    interview.saveResult('endless', {
      streak: r.streak,
      totalAnswered: r.totalAnswered,
      averageScore: r.averageScore,
      isNewRecord: r.streak > bestStreak,
    })
  }, [bestStreak, interview])

  if (phase === 'progress' && pool.length > 0) {
    return (
      <EndlessProgress
        questions={pool}
        threshold={threshold}
        evaluating={interview.evaluating}
        lastEval={interview.lastEval}
        onEvaluate={interview.evaluate}
        onGameOver={handleGameOver}
      />
    )
  }

  if (phase === 'over' && result) {
    return (
      <GameOverScreen
        result={result}
        bestStreak={bestStreak}
        onRetry={() => setPhase('start')}
        onDashboard={() => onNavigate?.('dashboard')}
      />
    )
  }

  return <EndlessStart bestStreak={bestStreak} onStart={handleStart} />
}
