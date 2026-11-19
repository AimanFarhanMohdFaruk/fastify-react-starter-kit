/**
 * SSR page gate — one policy seam for Page loaders.
 * Returns JSON outcomes only (including `{ redirectTo }`). Never `reply.redirect`
 * — that breaks `@fastify/react` client navigations on `/-/data/*`.
 * `/api` keeps requireSession.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { isAdmin } from '../models/admin'
import type { SessionUser } from '../models/auth'
import { getSessionUser } from './auth'

export type PageGatePolicy = 'public' | 'signedIn' | 'guestOnly' | 'admin'

/** App redirect signal — pages render `<Navigate to={redirectTo} />`. */
export type PageRedirect = { redirectTo: string }

type RedirectDenied = { ok: false; data: PageRedirect }
type AdminDenied = {
  ok: false
  data: PageRedirect | { forbidden: true }
}

type GateResultMap = {
  public: { ok: true; user: SessionUser | null }
  signedIn: { ok: true; user: SessionUser } | RedirectDenied
  guestOnly: { ok: true; user: null } | RedirectDenied
  admin: { ok: true; user: SessionUser } | AdminDenied
}

export type PageGateResult<P extends PageGatePolicy> = GateResultMap[P]

/**
 * Apply a page policy. Deny returns `{ redirectTo }` or `{ forbidden: true }`.
 * Only mutates `reply` for admin 403 (JSON body still returned).
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
        return {
          ok: false,
          data: { redirectTo: '/dashboard' },
        } as PageGateResult<P>
      }
      return { ok: true, user: null } as PageGateResult<P>

    case 'signedIn':
      if (!user) {
        return {
          ok: false,
          data: { redirectTo: '/login' },
        } as PageGateResult<P>
      }
      return { ok: true, user } as PageGateResult<P>

    case 'admin':
      if (!user) {
        return {
          ok: false,
          data: { redirectTo: '/login' },
        } as PageGateResult<P>
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
