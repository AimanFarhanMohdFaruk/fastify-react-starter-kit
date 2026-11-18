/**
 * Home page loader — optional session for chrome (email / admin).
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { isAdmin } from '../../models/admin'
import { gatePage } from '../page-gate'

export type HomePageData = {
  email: string | null
  isAdmin: boolean
}

export async function loadHomePage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<HomePageData> {
  const gate = await gatePage(req, reply, 'public')
  return {
    email: gate.user?.email ?? null,
    isAdmin: gate.user ? isAdmin(gate.user) : false,
  }
}
