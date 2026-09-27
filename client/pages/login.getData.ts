import type { FastifyReply, FastifyRequest } from 'fastify'

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { getSessionUser } = await import('../../app/controllers/auth')
  const user = await getSessionUser(ctx.req)
  if (user) {
    ctx.reply.redirect('/dashboard')
    return {}
  }
  return { error: null as string | null }
}
