/**
 * Thin HTTP handlers — parse → one model or service → JSON.
 * Session gate lives on the route (`requireSession` in index.ts).
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { sessionUser } from '../auth'
import { listReportsForUser } from '../../models/report'
import { enqueueReport } from '../../services/enqueue-report'
import { parseCreateBody, reportDto } from './dto'

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const rows = await listReportsForUser(sessionUser(req).id)
  return reply.send(rows.map(reportDto))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { payload } = parseCreateBody(req.body)
  try {
    const report = await enqueueReport(sessionUser(req).id, payload)
    return reply.code(201).send(reportDto(report))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enqueue failed'
    return reply.code(400).send({ error: message })
  }
}
