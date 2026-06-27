import { useCallback } from 'react'
import type { Question } from '@/types'
import { trpc } from '@/lib/trpc'

export function useQuestions() {
  const { data: questions = [], isLoading: loading, refetch } = trpc.questions.list.useQuery()
  const createMutation = trpc.questions.create.useMutation({
    onSuccess: () => { void refetch() },
  })
  const deleteMutation = trpc.questions.delete.useMutation({
    onSuccess: () => { void refetch() },
  })

  const add = useCallback(async (data: {
    question: string
    category: string
    tags?: string[]
    difficulty?: number
    interviewType?: string
  }) => {
    return createMutation.mutateAsync({
      question: data.question,
      category: data.category,
      tags: data.tags,
      difficulty: data.difficulty,
      interviewType: (data.interviewType ?? 'technical') as Question['interviewType'],
    })
  }, [createMutation])

  const remove = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync({ id })
  }, [deleteMutation])

  return { questions, loading, reload: refetch, add, remove }
}
