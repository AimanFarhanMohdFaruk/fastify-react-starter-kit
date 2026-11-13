/**
 * API index — scan this file.
 * Handlers are function refs (rename-safe). Bodies live in ./handlers.ts.
 */
import type { FastifyInstance } from 'fastify'
import { requireSession } from '../auth'
import { create, list } from './handlers'

export async function registerReportRoutes(app: FastifyInstance) {
  app.get('/api/reports', { preHandler: requireSession }, list)
  app.post('/api/reports', { preHandler: requireSession }, create)
}
