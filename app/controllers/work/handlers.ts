/**
 * Thin HTTP — enqueue only. No domain row.
 * Domain errors bubble to composeWebApp setErrorHandler.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { enqueue } from '../../queue'
import { parseShoutMessage } from '../../services/shout'
import { sessionUser } from '../auth'
import { parseShoutBody, workEnqueueDto } from './dto'

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { message: raw } = parseShoutBody(req.body)
  const message = parseShoutMessage(raw)
  const jobId = await enqueue('shout', {
    message,
    userId: sessionUser(req).id,
  })
  return reply
    .code(202)
    .send(workEnqueueDto({ name: 'shout', jobId: jobId ?? null }))
}
