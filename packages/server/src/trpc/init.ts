import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context.js'
import { GOOGLE_CLIENT_ID } from '../auth/config.js'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = GOOGLE_CLIENT_ID
  ? t.procedure.use(({ ctx, next }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return next({ ctx: { ...ctx, user: ctx.user } })
    })
  : t.procedure
