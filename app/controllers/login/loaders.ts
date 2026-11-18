/**
 * Login page loader — redirect signed-in users to the dashboard.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { gatePage } from '../page-gate'

export type LoginPageData = Record<string, never>

export async function loadLoginPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<LoginPageData> {
  const gate = await gatePage(req, reply, 'guestOnly')
  if (!gate.ok) return gate.data
  return {}
}
