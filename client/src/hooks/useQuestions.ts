import { useState, useEffect, useCallback } from 'react'
import type { Question } from '@/types'
import { fetchQuestions, createQuestion, deleteQuestion } from '@/lib/api'

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchQuestions()
      setQuestions(data)
    } catch (err) {
      console.error('Failed to load questions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (data: {
    question: string
    category: string
    tags?: string[]
    difficulty?: number
  }) => {
    const q = await createQuestion(data)
    setQuestions((prev) => [...prev, q])
    return q
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteQuestion(id)
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }, [])

  return { questions, loading, reload: load, add, remove }
}
