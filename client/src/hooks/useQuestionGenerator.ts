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

  useEffect(() => {
    const unsub = subscribe((data) => {
      switch (data.type) {
        case 'questions:generating':
          setGenerating(true)
          break
        case 'questions:generated': {
          setGenerating(false)
          const { parsed } = parseClaudeJson<{ questions: GeneratedQuestion[] }>(data.result as string)
          if (parsed?.questions) {
            setGeneratedQuestions(parsed.questions)
          }
          break
        }
        case 'chat:error':
          setGenerating(false)
          break
      }
    })
    return unsub
  }, [])

  const generate = useCallback((type: 'technical' | 'behavioral' | 'both', count = 5) => {
    setGeneratedQuestions([])
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
    generate,
    saveQuestion,
    saveAll,
    clear: () => setGeneratedQuestions([]),
  }
}
