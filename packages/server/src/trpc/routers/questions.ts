import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { router, protectedProcedure } from '../init.js'
import { readAll, readOne, writeOne, deleteOne } from '../../data/store.js'
import type { Question } from '@escapist/shared'

export const questionsRouter = router({
  list: protectedProcedure.query(() => readAll<Question>('questions')),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const q = readOne<Question>('questions', input.id)
      if (!q) throw new Error('Not found')
      return q
    }),

  create: protectedProcedure
    .input(z.object({
      question: z.string().min(1),
      category: z.string().min(1),
      tags: z.array(z.string()).default([]),
      difficulty: z.number().min(1).max(5).default(3),
      interviewType: z.enum(['technical', 'behavioral', 'opinion']).default('technical'),
    }))
    .mutation(({ input }) => {
      const id = `q_${uuid().slice(0, 8)}`
      const newQuestion: Question = {
        id,
        ...input,
        status: 'unlearned',
        bestScore: null,
        averageScore: null,
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastAttemptAt: null,
      }
      writeOne('questions', id, newQuestion)
      return newQuestion
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.record(z.string(), z.unknown()),
    }))
    .mutation(({ input }) => {
      const existing = readOne<Question>('questions', input.id)
      if (!existing) throw new Error('Not found')
      const updated = { ...existing, ...input.data, id: existing.id }
      writeOne('questions', existing.id, updated)
      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const deleted = deleteOne('questions', input.id)
      if (!deleted) throw new Error('Not found')
      return { ok: true }
    }),
})
