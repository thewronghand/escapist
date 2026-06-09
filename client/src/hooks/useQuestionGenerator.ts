import { useState, useEffect, useCallback } from 'react'
import { send, subscribe } from '@/lib/ws'
import { parseClaudeJson } from '@/lib/utils'
import { createQuestion } from '@/lib/api'
import type { InterviewType } from '@/types'

interface GeneratedQuestion {
  question: string
  category: string
  interviewType: InterviewType
  tags: string[]
  difficulty: number
}

export function useQuestionGenerator() {
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribe((data) => {
      switch (data.type) {
        case 'questions:generating':
          setGenerating(true)
          setError(null)
          break
        case 'questions:generated': {
          setGenerating(false)
          const raw = data.result as string
          const { parsed } = parseClaudeJson<{ questions: GeneratedQuestion[] }>(raw)
          if (parsed?.questions?.length) {
            setGeneratedQuestions(parsed.questions)
            setError(null)
          } else {
            setError('질문 생성 결과를 파싱할 수 없습니다')
            setGeneratedQuestions([])
          }
          break
        }
        case 'chat:error':
          setGenerating(false)
          setError(data.error as string ?? '질문 생성에 실패했습니다')
          break
      }
    })
    return unsub
  }, [])

  const generate = useCallback((type: 'technical' | 'behavioral' | 'both', count = 5) => {
    setGeneratedQuestions([])
    setError(null)
    send({
      type: 'questions:generate',
      generateType: type,
      generateCount: count,
    })
  }, [])

  const saveQuestion = useCallback(async (q: GeneratedQuestion) => {
    return createQuestion({
      question: q.question,
      category: q.category,
      tags: q.tags,
      difficulty: q.difficulty,
    })
  }, [])

  const saveAll = useCallback(async () => {
    const results = []
    for (const q of generatedQuestions) {
      const saved = await saveQuestion(q)
      results.push(saved)
    }
    return results
  }, [generatedQuestions, saveQuestion])

  return {
    generating,
    generatedQuestions,
    error,
    generate,
    saveQuestion,
    saveAll,
    clear: () => { setGeneratedQuestions([]); setError(null) },
  }
}
