import { useState, useCallback } from 'react'
import type { Question } from '@/types'
import { useQuestions } from '@/hooks/useQuestions'
import { useInterview } from '@/hooks/useInterview'
import type { InterviewSettings, InterviewItem, InterviewResult } from '@/hooks/useInterview'
import { InterviewSetup } from '@/components/interview/InterviewSetup'
import { InterviewProgress } from '@/components/interview/InterviewProgress'
import { InterviewResult as InterviewResultView } from '@/components/interview/InterviewResult'
import { gradeFor } from '@/lib/utils'

type Phase = 'setup' | 'progress' | 'result'

interface InterviewPageProps {
  onNavigate?: (nav: string) => void
}

export function InterviewPage({ onNavigate }: InterviewPageProps) {
  const { questions } = useQuestions()
  const interview = useInterview()
  const [phase, setPhase] = useState<Phase>('setup')
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])
  const [settings, setSettings] = useState<InterviewSettings | null>(null)
  const [result, setResult] = useState<InterviewResult | null>(null)

  const handleStart = useCallback((s: InterviewSettings) => {
    const picked = interview.pickQuestions(questions, s)
    if (picked.length === 0) return
    setSettings(s)
    setSelectedQuestions(picked)
    setPhase('progress')
  }, [questions, interview])

  const handleFinish = useCallback((items: InterviewItem[]) => {
    const totalScore = items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length * 10)
      : 0
    const grade = gradeFor(totalScore)

    // 카테고리별 분석
    const catMap = new Map<string, { sum: number; count: number }>()
    for (const item of items) {
      const entry = catMap.get(item.category) ?? { sum: 0, count: 0 }
      entry.sum += item.score
      entry.count++
      catMap.set(item.category, entry)
    }
    const categoryAnalysis = Array.from(catMap.entries()).map(([category, { sum, count }]) => ({
      category,
      avg: Math.round(sum / count * 10) / 10,
      count,
    }))

    const interviewResult: InterviewResult = {
      totalScore,
      grade,
      items,
      categoryAnalysis,
      summary: '',
    }

    setResult(interviewResult)
    setPhase('result')

    // 총평 요청
    interview.requestSummary(interviewResult)

    // 기록 저장
    interview.saveResult('interview', {
      totalScore,
      grade,
      questionCount: items.length,
      categories: [...new Set(items.map((i) => i.category))],
    })
  }, [interview])

  const handleAbort = () => setPhase('setup')
  const handleRetry = () => setPhase('setup')
  const handleDashboard = () => onNavigate?.('dashboard')

  if (phase === 'progress' && selectedQuestions.length > 0) {
    return (
      <InterviewProgress
        questions={selectedQuestions}
        timeLimit={settings?.timeLimit ?? null}
        evaluating={interview.evaluating}
        lastEval={interview.lastEval}
        onEvaluate={interview.evaluate}
        onFinish={handleFinish}
        onAbort={handleAbort}
      />
    )
  }

  if (phase === 'result' && result) {
    // summary 업데이트 반영
    const resultWithSummary = { ...result, summary: interview.summary || result.summary }
    return (
      <InterviewResultView
        result={resultWithSummary}
        summarizing={interview.summarizing}
        onRetry={handleRetry}
        onDashboard={handleDashboard}
      />
    )
  }

  return <InterviewSetup onStart={handleStart} />
}
