import type { Inertia } from 'alex-node-inertiajs'

declare module 'fastify' {
  interface FastifyReply {
    inertia: Inertia
  }
}
