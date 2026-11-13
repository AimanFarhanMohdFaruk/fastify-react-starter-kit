/**
 * Thin HTTP handlers — parse → one model or service → JSON.
 * Session gate lives on the route (`requireSession` in index.ts).
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { sessionUser } from '../auth'
import { listDemoJobsForUser } from '../../models/demo-job'
import { enqueueDemoJob } from '../../services/enqueue-demo'
import { jobDto, parseCreateBody } from './dto'

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const jobs = await listDemoJobsForUser(sessionUser(req).id)
  return reply.send(jobs.map(jobDto))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { payload } = parseCreateBody(req.body)
  try {
    const job = await enqueueDemoJob(sessionUser(req).id, payload)
    return reply.code(201).send(jobDto(job))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enqueue failed'
    return reply.code(400).send({ error: message })
  }
}
