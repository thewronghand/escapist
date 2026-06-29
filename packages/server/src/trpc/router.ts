import { router } from './init.js'
import { questionsRouter } from './routers/questions.js'
import { sessionsRouter } from './routers/sessions.js'
import { statsRouter } from './routers/stats.js'
import { profileRouter } from './routers/profile.js'
import { adminRouter } from './routers/admin.js'

export const appRouter = router({
  questions: questionsRouter,
  sessions: sessionsRouter,
  stats: statsRouter,
  profile: profileRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
