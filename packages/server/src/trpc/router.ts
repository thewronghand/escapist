import { router } from './init.js'
import { questionsRouter } from './routers/questions.js'
import { sessionsRouter } from './routers/sessions.js'
import { statsRouter } from './routers/stats.js'
import { profileRouter } from './routers/profile.js'

export const appRouter = router({
  questions: questionsRouter,
  sessions: sessionsRouter,
  stats: statsRouter,
  profile: profileRouter,
})

export type AppRouter = typeof appRouter
