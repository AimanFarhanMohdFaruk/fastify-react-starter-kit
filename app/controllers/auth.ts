import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { auth, isUserBanned, type SessionUser } from '../models/auth'
import { isAdmin } from '../models/admin'

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `requireSession` preHandler. */
    user?: SessionUser
  }
}

/** Convert Fastify request to Fetch API Request for Better Auth. */
export async function toAuthRequest(req: FastifyRequest) {
  const host = req.headers.host ?? 'localhost:3000'
  const url = new URL(req.url, `http://${host}`)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.set(key, value)
  }
  const method = req.method.toUpperCase()
  const init: RequestInit = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
    if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  }
  return new Request(url, init)
}

export async function getSessionUser(req: FastifyRequest) {
  const session = await auth.api.getSession({ headers: fromFastifyHeaders(req) })
  const user = session?.user ?? null
  if (!user) return null
  // Defense in depth — treat an active ban as no session for SSR + /api.
  if (isUserBanned(user)) return null
  return user
}

/** Route preHandler — 401 if no session; sets `req.user`. */
export async function requireSession(req: FastifyRequest, reply: FastifyReply) {
  const user = await getSessionUser(req)
  if (!user) return reply.code(401).send({ error: 'Unauthorized' })
  req.user = user
}

/** Read `req.user` after `requireSession` — throws if the preHandler was omitted. */
export function sessionUser(req: FastifyRequest): SessionUser {
  if (!req.user) {
    throw new Error('sessionUser: requireSession preHandler missing')
  }
  return req.user
}

export type AdminGate =
  | { ok: true; user: SessionUser }
  | { ok: false; kind: 'redirect' }
  | { ok: false; kind: 'forbidden' }

/** SSR gate for `/admin/**` getData — model owns isAdmin. */
export async function gateAdminPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminGate> {
  const user = await getSessionUser(req)
  if (!user) {
    reply.redirect('/login')
    return { ok: false, kind: 'redirect' }
  }
  if (!isAdmin(user)) {
    reply.code(403)
    return { ok: false, kind: 'forbidden' }
  }
  return { ok: true, user }
}

function fromFastifyHeaders(req: FastifyRequest) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.set(key, value)
  }
  return headers
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    config: {
      // Tighter than the global web limit — auth endpoints are brute-force targets.
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
    async handler(req, reply) {
      const request = await toAuthRequest(req)
      const response = await auth.handler(request)
      reply.status(response.status)
      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })
      const text = await response.text()
      return reply.send(text || null)
    },
  })
}
