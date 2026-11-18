/**
 * SSR page gate — one policy seam for Page loaders.
 * `/api` keeps requireSession; this module owns HTML redirects / 403 only.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { isAdmin } from '../models/admin'
import type { SessionUser } from '../models/auth'
import { getSessionUser } from './auth'

export type PageGatePolicy = 'public' | 'signedIn' | 'guestOnly' | 'admin'

type RedirectDenied = { ok: false; data: Record<string, never> }
type AdminDenied = {
  ok: false
  data: Record<string, never> | { forbidden: true }
}

type GateResultMap = {
  public: { ok: true; user: SessionUser | null }
  signedIn: { ok: true; user: SessionUser } | RedirectDenied
  guestOnly: { ok: true; user: null } | RedirectDenied
  admin: { ok: true; user: SessionUser } | AdminDenied
}

export type PageGateResult<P extends PageGatePolicy> = GateResultMap[P]

/**
 * Apply a page policy. Mutates `reply` on deny (redirect or 403).
 * Loaders: `const gate = await gatePage(...); if (!gate.ok) return gate.data`
 */
export async function gatePage<P extends PageGatePolicy>(
  req: FastifyRequest,
  reply: FastifyReply,
  policy: P,
): Promise<PageGateResult<P>> {
  const user = await getSessionUser(req)

  switch (policy) {
    case 'public':
      return { ok: true, user } as PageGateResult<P>

    case 'guestOnly':
      if (user) {
        reply.redirect('/dashboard')
        return { ok: false, data: {} } as PageGateResult<P>
      }
      return { ok: true, user: null } as PageGateResult<P>

    case 'signedIn':
      if (!user) {
        reply.redirect('/login')
        return { ok: false, data: {} } as PageGateResult<P>
      }
      return { ok: true, user } as PageGateResult<P>

    case 'admin':
      if (!user) {
        reply.redirect('/login')
        return { ok: false, data: {} } as PageGateResult<P>
      }
      if (!isAdmin(user)) {
        reply.code(403)
        return { ok: false, data: { forbidden: true } } as PageGateResult<P>
      }
      return { ok: true, user } as PageGateResult<P>

    default: {
      const _exhaustive: never = policy
      throw new Error(`Unknown page gate policy: ${String(_exhaustive)}`)
    }
  }
}
