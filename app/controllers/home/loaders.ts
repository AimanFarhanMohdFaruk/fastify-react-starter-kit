/**
 * Home page loader — optional session for chrome (email / admin).
 */
import type { FastifyRequest } from 'fastify'
import { isAdmin } from '../../models/admin'
import { getSessionUser } from '../auth'

export type HomePageData = {
  email: string | null
  isAdmin: boolean
}

export async function loadHomePage(req: FastifyRequest): Promise<HomePageData> {
  const user = await getSessionUser(req)
  return {
    email: user?.email ?? null,
    isAdmin: user ? isAdmin(user) : false,
  }
}
