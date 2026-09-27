import type { FastifyReply, FastifyRequest } from 'fastify'

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { getSessionUser } = await import('../../app/controllers/auth')
  const { listDemoJobsForUser } = await import('../../app/models/demo-job')
  const user = await getSessionUser(ctx.req)
  if (!user) {
    ctx.reply.redirect('/login')
    return {}
  }
  const jobs = await listDemoJobsForUser(user.id)
  return {
    email: user.email,
    jobs: jobs.map((j) => ({
      id: j.id,
      payload: j.payload,
      status: j.status,
      result: j.result,
      createdAt: j.createdAt.toISOString(),
    })),
  }
}
