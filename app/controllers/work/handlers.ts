/**
 * Thin HTTP — enqueue only. No domain row.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { sessionUser } from '../auth'
import { enqueue } from '../../queue'
import { parseShoutBody, workEnqueueDto } from './dto'

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { message } = parseShoutBody(req.body)
  if (!message.trim()) {
    return reply.code(400).send({ error: 'Message required' })
  }
  try {
    const jobId = await enqueue('shout', {
      message: message.trim(),
      userId: sessionUser(req).id,
    })
    return reply
      .code(202)
      .send(workEnqueueDto({ name: 'shout', jobId: jobId ?? null }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Enqueue failed'
    return reply.code(500).send({ error: msg })
  }
}
