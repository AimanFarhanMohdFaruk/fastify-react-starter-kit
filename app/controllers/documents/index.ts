/**
 * API index — scan this file.
 * Handlers are function refs (rename-safe). Bodies live in ./handlers.ts.
 */
import type { FastifyInstance } from 'fastify'
import { requireSession } from '../auth'
import { create, list, show } from './handlers'

export async function registerDocumentRoutes(app: FastifyInstance) {
  app.post('/api/documents', { preHandler: requireSession }, create)
  app.get('/api/documents', { preHandler: requireSession }, list)
  app.get('/api/documents/:id', { preHandler: requireSession }, show)
}
