import type { FastifyInstance } from 'fastify'
import { getSessionUser } from './auth'
import { enqueueDemoJob } from '../services/enqueue-demo'
import { listDemoJobsForUser } from '../models/demo-job'

function jobDto(job: Awaited<ReturnType<typeof listDemoJobsForUser>>[number]) {
  return {
    id: job.id,
    payload: job.payload,
    status: job.status,
    result: job.result,
    createdAt: job.createdAt.toISOString(),
  }
}

export async function registerJobRoutes(app: FastifyInstance) {
  app.get('/api/jobs', async (req, reply) => {
    const user = await getSessionUser(req)
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })
    const jobs = await listDemoJobsForUser(user.id)
    return reply.send(jobs.map(jobDto))
  })

  app.post('/api/jobs', async (req, reply) => {
    const user = await getSessionUser(req)
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })
    const body = req.body as { payload?: string }
    try {
      const job = await enqueueDemoJob(user.id, String(body.payload ?? ''))
      return reply.code(201).send(jobDto(job))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enqueue failed'
      return reply.code(400).send({ error: message })
    }
  })
}
