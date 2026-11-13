/**
 * API index — scan this file.
 * Handlers are function refs (rename-safe). Bodies live in ./handlers.ts.
 */
import type { FastifyInstance } from 'fastify'
import { requireSession } from '../auth'
import { create, destroy, list, show, update } from './handlers'

export async function registerPostRoutes(app: FastifyInstance) {
  app.get('/api/posts', { preHandler: requireSession }, list)
  app.post('/api/posts', { preHandler: requireSession }, create)
  app.get('/api/posts/:id', { preHandler: requireSession }, show)
  app.patch('/api/posts/:id', { preHandler: requireSession }, update)
  app.delete('/api/posts/:id', { preHandler: requireSession }, destroy)
}
