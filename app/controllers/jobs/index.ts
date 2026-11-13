/**
 * API index — scan this file.
 * Handlers are function refs (rename-safe). Bodies live in ./handlers.ts.
 */
import type { FastifyInstance } from 'fastify'
import { requireSession } from '../auth'
import { create, list } from './handlers'

export async function registerJobRoutes(app: FastifyInstance) {
  app.get('/api/jobs', { preHandler: requireSession }, list)
  app.post('/api/jobs', { preHandler: requireSession }, create)
}
