/**
 * API index — fire-and-forget work (stupid queue demo).
 */
import type { FastifyInstance } from 'fastify'
import { requireSession } from '../auth'
import { create } from './handlers'

export async function registerWorkRoutes(app: FastifyInstance) {
  app.post('/api/work', { preHandler: requireSession }, create)
}
