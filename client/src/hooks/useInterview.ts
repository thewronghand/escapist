import { useState, useEffect, useCallback } from 'react'
import type { Question } from '@/types'
import { send, subscribe } from '@/lib/ws'
import { parseClaudeJson } from '@/lib/utils'

interface EvalResult {
  score: number
  feedback: string
  modelAnswer: string
}

interface InterviewItem {
  questionId: string
  question: string
  category: string
  answer: string | null
  score: number
  status: 'correct' | 'partial' | 'wrong' | 'pass' | 'timeout'
  feedback: string
  modelAnswer: string
  timeTaken: number
}

interface InterviewSettings {
  questionCount: number
  categories: string[]
  difficultyRange: [number, number]
  timeLimit: number | null
  strategy: 'random' | 'weak-first' | 'unlearned-first'
}

interface InterviewResult {
  totalScore: number
  grade: string
  items: InterviewItem[]
  categoryAnalysis: { category: string; avg: number; count: number }[]
  summary: string
}

export function useInterview() {
  const [evaluating, setEvaluating] = useState(false)
  const [lastEval, setLastEval] = useState<EvalResult | null>(null)
  const [summary, setSummary] = useState<string>('')
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    const unsub = subscribe((data) => {
      switch (data.type) {
        case 'interview:evaluating':
          setEvaluating(true)
          break
        case 'interview:evalResult': {
          setEvaluating(false)
          const { parsed } = parseClaudeJson<EvalResult>(data.result as string)
          setLastEval(parsed ?? { score: 5, feedback: '평가 파싱 실패', modelAnswer: '' })
          break
        }
        case 'interview:summarizing':
          setSummarizing(true)
          break
        case 'interview:summaryResult':
          setSummarizing(false)
          setSummary(data.result as string)
          break
      }
    })
    return unsub
  }, [])

  const evaluate = useCallback((question: string, answer: string) => {
    setLastEval(null)
    send({
      type: 'interview:eval',
      questionForEval: question,
      answerForEval: answer,
    })
  }, [])

  const requestSummary = useCallback((result: InterviewResult) => {
    setSummary('')
    send({
      type: 'interview:summary',
      interviewData: {
        totalScore: result.totalScore,
        grade: result.grade,
        items: result.items.map((i) => ({
          question: i.question,
          score: i.score,
          status: i.status,
        })),
        categoryAnalysis: result.categoryAnalysis,
      },
    })
  }, [])

  const saveResult = useCallback((mode: string, data: Record<string, unknown>) => {
    send({
      type: 'interview:save',
      interviewData: { mode, ...data },
    })
  }, [])

  const pickQuestions = useCallback((
    questions: Question[],
    settings: InterviewSettings,
  ): Question[] => {
    let pool = [...questions]

    // 카테고리 필터
    if (settings.categories.length > 0) {
      pool = pool.filter((q) => settings.categories.includes(q.category))
    }

    // 난이도 필터
    pool = pool.filter(
      (q) => q.difficulty >= settings.difficultyRange[0] && q.difficulty <= settings.difficultyRange[1],
    )

    // 전략별 정렬
    switch (settings.strategy) {
      case 'weak-first':
        pool.sort((a, b) => (a.averageScore ?? 10) - (b.averageScore ?? 10))
        break
      case 'unlearned-first':
        pool.sort((a, b) => (a.attempts) - (b.attempts))
        break
      default:
        // 셔플
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]]
        }
    }

    return pool.slice(0, settings.questionCount)
  }, [])

  return {
    evaluating,
    lastEval,
    summary,
    summarizing,
    evaluate,
    requestSummary,
    saveResult,
    pickQuestions,
  }
}

export type { InterviewSettings, InterviewItem, InterviewResult, EvalResult }
