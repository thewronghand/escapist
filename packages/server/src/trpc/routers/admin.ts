import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../init.js'
import { ALLOWED_EMAIL } from '../../auth/config.js'
import {
  issueCommand,
  getCommandResult,
  getRecentCommands,
  getWorkerLogs,
  isAdminSessionConnected,
  getManagerSessionId,
} from '../../admin/store.js'

const adminGuard = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.isAdminBearer) return next({ ctx })
  if (!ALLOWED_EMAIL || ctx.user?.email !== ALLOWED_EMAIL) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
  }
  return next({ ctx })
})

export const adminRouter = router({
  status: adminGuard.query(() => ({
    adminSessionConnected: isAdminSessionConnected(),
    managerSessionId: getManagerSessionId(),
  })),

  sendCommand: adminGuard
    .input(
      z.object({
        command: z.enum(['restart', 'update', 'custom', 'message']),
        payload: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      if (!isAdminSessionConnected()) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: '관리 세션이 연결되어 있지 않습니다' })
      }
      const entry = issueCommand(input.command, input.payload)
      return { commandId: entry.commandId, issuedAt: entry.issuedAt }
    }),

  getCommandResult: adminGuard
    .input(z.object({ commandId: z.string() }))
    .query(({ input }) => {
      const entry = getCommandResult(input.commandId)
      if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'Command not found' })
      return entry
    }),

  getRecentCommands: adminGuard
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(({ input }) => getRecentCommands(input.limit)),

  getLogs: adminGuard
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(({ input }) => ({ lines: getWorkerLogs(input.limit) })),
})
