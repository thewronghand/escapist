import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { readAll, readOne, writeOne, deleteOne } from '../data/store.js'

interface Question {
  id: string
  question: string
  category: string
  interviewType: string
  tags: string[]
  difficulty: number
  status: 'unlearned' | 'learning' | 'weak' | 'master'
  bestScore: number | null
  averageScore: number | null
  attempts: number
  createdAt: string
  lastAttemptAt: string | null
}

export const questionsRouter = Router()

questionsRouter.get('/', async (_req, res) => {
  const questions = await readAll<Question>('questions')
  res.json(questions)
})

questionsRouter.get('/:id', async (req, res) => {
  const question = await readOne<Question>('questions', req.params.id)
  if (!question) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(question)
})

questionsRouter.post('/', async (req, res) => {
  const { question, category, tags = [], difficulty = 3, interviewType = 'technical' } = req.body
  if (!question || !category) {
    res.status(400).json({ error: 'question and category are required' })
    return
  }

  const id = `q_${uuid().slice(0, 8)}`
  const newQuestion: Question = {
    id,
    question,
    category,
    interviewType,
    tags,
    difficulty,
    status: 'unlearned',
    bestScore: null,
    averageScore: null,
    attempts: 0,
    createdAt: new Date().toISOString(),
    lastAttemptAt: null,
  }

  await writeOne('questions', id, newQuestion)
  res.status(201).json(newQuestion)
})

questionsRouter.put('/:id', async (req, res) => {
  const existing = await readOne<Question>('questions', req.params.id)
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const updated = { ...existing, ...req.body, id: existing.id }
  await writeOne('questions', existing.id, updated)
  res.json(updated)
})

questionsRouter.delete('/:id', async (req, res) => {
  const deleted = await deleteOne('questions', req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({ ok: true })
})
