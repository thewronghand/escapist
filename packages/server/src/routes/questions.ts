import type { FastifyInstance } from 'fastify'
import { v4 as uuid } from 'uuid'
import { readAll, readOne, writeOne, deleteOne } from '../data/store.js'
import type { Question } from '@escapist/shared'

export async function questionsPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async () => {
    return readAll<Question>('questions')
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const question = readOne<Question>('questions', req.params.id)
    if (!question) {
      reply.code(404).send({ error: 'Not found' })
      return
    }
    return question
  })

  fastify.post<{ Body: { question?: string; category?: string; tags?: string[]; difficulty?: number; interviewType?: string } }>(
    '/',
    async (req, reply) => {
      const { question, category, tags = [], difficulty = 3, interviewType = 'technical' } = req.body
      if (!question || !category) {
        reply.code(400).send({ error: 'question and category are required' })
        return
      }

      const id = `q_${uuid().slice(0, 8)}`
      const newQuestion: Question = {
        id,
        question,
        category,
        interviewType: interviewType as Question['interviewType'],
        tags,
        difficulty,
        status: 'unlearned',
        bestScore: null,
        averageScore: null,
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastAttemptAt: null,
      }

      writeOne('questions', id, newQuestion)
      reply.code(201).send(newQuestion)
    },
  )

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', async (req, reply) => {
    const existing = readOne<Question>('questions', req.params.id)
    if (!existing) {
      reply.code(404).send({ error: 'Not found' })
      return
    }

    const updated = { ...existing, ...req.body, id: existing.id }
    writeOne('questions', existing.id, updated)
    return updated
  })

  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const deleted = deleteOne('questions', req.params.id)
    if (!deleted) {
      reply.code(404).send({ error: 'Not found' })
      return
    }
    return { ok: true }
  })
}
