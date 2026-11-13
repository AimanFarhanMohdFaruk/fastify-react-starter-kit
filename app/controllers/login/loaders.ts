/**
 * Login page loader — redirect signed-in users to the dashboard.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getSessionUser } from '../auth'

export type LoginPageData =
  | Record<string, never>
  | { error: string | null }

export async function loadLoginPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<LoginPageData> {
  const user = await getSessionUser(req)
  if (user) {
    reply.redirect('/dashboard')
    return {}
  }
  return { error: null }
}
