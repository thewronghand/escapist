import type { Question } from '@/types'

const BASE = '/api'

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export function fetchQuestions(): Promise<Question[]> {
  return request<Question[]>('/questions')
}

export function createQuestion(data: {
  question: string
  category: string
  tags?: string[]
  difficulty?: number
  interviewType?: string
}): Promise<Question> {
  return request<Question>('/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
  return request<Question>(`/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteQuestion(id: string): Promise<void> {
  return request<void>(`/questions/${id}`, { method: 'DELETE' })
}
