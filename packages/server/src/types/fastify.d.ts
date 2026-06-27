import type { AuthPayload } from '../auth/middleware.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthPayload
  }
}
