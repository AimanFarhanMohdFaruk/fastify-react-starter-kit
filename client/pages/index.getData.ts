import type { FastifyReply, FastifyRequest } from 'fastify'

export async function getData(ctx: { req: FastifyRequest }) {
  const { getSessionUser } = await import('../../app/controllers/auth')
  const user = await getSessionUser(ctx.req)
  return {
    title: 'Personal starter-kit',
    email: user?.email ?? null,
  }
}
